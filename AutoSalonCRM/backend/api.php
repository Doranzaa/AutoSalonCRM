<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://autosaloncrm.page.gd');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$host = 'sql311.infinityfree.com';
$user = 'if0_42002069';
$pass = 'Prokosa0563';
$dbname = 'if0_42002069_autosalon';

$mysqli = new mysqli($host, $user, $pass, $dbname);
if ($mysqli->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "DB connection failed"]);
    exit;
}
$mysqli->set_charset("utf8mb4");

$method   = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? '';
$id       = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action   = $_GET['action'] ?? '';

function getJsonBody() {
    $data = file_get_contents("php://input");
    return json_decode($data, true);
}

function getAllHeadersSafe() {
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) === 'HTTP_') {
                $key = str_replace(
                    ' ',
                    '-',
                    ucwords(strtolower(str_replace('_', ' ', substr($name, 5))))
                );
                $headers[$key] = $value;
            }
        }
    }

    if (empty($headers['Authorization'])) {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
    }

    return $headers;
}

/**
 * ТЕПЕР токен береться основним чином з ?token=...
 * бо InfinityFree не прокидує Authorization до PHP.
 */
function getAuthUser($db) {
    // 1. Пробуємо взяти токен з query ?token=...
    $token = $_GET['token'] ?? '';
    $source = 'query';

    // 2. Якщо в query немає – пробуємо заголовки (на майбутнє)
    if (!$token) {
        $headers = getAllHeadersSafe();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

        if (strpos($authHeader, 'Bearer ') === 0) {
            $token = substr($authHeader, 7);
            $source = 'auth-header';
        } elseif (!empty($headers['X-Auth-Token'])) {
            $token = trim($headers['X-Auth-Token']);
            $source = 'x-auth-token';
        } else {
            header('X-Debug-Auth: no-token-anywhere');
            return ['role' => 'guest', 'id' => null, 'login' => null];
        }
    }

    if (!$token) {
        header('X-Debug-Auth: empty-token');
        return ['role' => 'guest', 'id' => null, 'login' => null];
    }

    header('X-Debug-Token: ' . $token);
    header('X-Debug-Source: ' . $source);

    $stmt = $db->prepare("
        SELECT u.id, u.login, r.name AS role
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.api_token = ?
        LIMIT 1
    ");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $res = $stmt->get_result();
    $user = $res->fetch_assoc();

    if ($user) {
        return [
            'role'  => $user['role'],
            'id'    => (int)$user['id'],
            'login' => $user['login'],
        ];
    }

    header('X-Debug-Auth: not-found');
    return ['role' => 'guest', 'id' => null, 'login' => null];
}

function requireAdmin($authUser) {
    if (($authUser['role'] ?? 'guest') !== 'admin') {
        http_response_code(403);
        echo json_encode(["error" => "Admin only"]);
        exit;
    }
}

function requireUserOrAdmin($authUser) {
    if (!in_array(($authUser['role'] ?? 'guest'), ['user', 'admin'], true)) {
        http_response_code(403);
        echo json_encode(["error" => "User or admin required"]);
        exit;
    }
}

function simpleCrud($table, $fields, $method, $id, $db, $authUser) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $db->prepare("SELECT * FROM $table WHERE id = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $res = $stmt->get_result();
                $row = $res->fetch_assoc();
                if ($row) echo json_encode($row);
                else {
                    http_response_code(404);
                    echo json_encode(["error" => "Not found"]);
                }
            } else {
                $res = $db->query("SELECT * FROM $table ORDER BY id DESC");
                $items = [];
                while ($r = $res->fetch_assoc()) $items[] = $r;
                echo json_encode($items);
            }
            break;

        case 'POST':
            requireAdmin($authUser);
            $body = getJsonBody();
            $cols = implode(',', $fields);
            $placeholders = implode(',', array_fill(0, count($fields), '?'));
            $types = str_repeat('s', count($fields));
            $stmt = $db->prepare("INSERT INTO $table ($cols) VALUES ($placeholders)");
            $values = [];
            foreach ($fields as $f) $values[] = $body[$f] ?? '';
            $stmt->bind_param($types, ...$values);
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["id" => $db->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Insert failed"]);
            }
            break;

        case 'PUT':
            requireAdmin($authUser);
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID required"]);
                return;
            }
            $body = getJsonBody();
            $sets = [];
            foreach ($fields as $f) $sets[] = "$f = ?";
            $setStr = implode(',', $sets);
            $types = str_repeat('s', count($fields)) . 'i';
            $stmt = $db->prepare("UPDATE $table SET $setStr WHERE id = ?");
            $values = [];
            foreach ($fields as $f) $values[] = $body[$f] ?? '';
            $values[] = $id;
            $stmt->bind_param($types, ...$values);
            if ($stmt->execute()) echo json_encode(["status" => "updated"]);
            else {
                http_response_code(500);
                echo json_encode(["error" => "Update failed"]);
            }
            break;

        case 'DELETE':
            requireAdmin($authUser);
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID required"]);
                return;
            }
            $stmt = $db->prepare("DELETE FROM $table WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) echo json_encode(["status" => "deleted"]);
            else {
                http_response_code(500);
                echo json_encode(["error" => "Delete failed"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
    }
}

function handleAuth($method, $action, $db, $authUser) {
    if ($method === 'POST' && $action === 'register') {
        $body = getJsonBody();
        $login = trim($body['login'] ?? '');
        $password = $body['password'] ?? '';

        if (!$login || !$password) {
            http_response_code(422);
            echo json_encode(["error" => "Login and password required"]);
            return;
        }

        $check = $db->prepare("SELECT id FROM users WHERE login = ? LIMIT 1");
        $check->bind_param("s", $login);
        $check->execute();
        $exists = $check->get_result()->fetch_assoc();
        if ($exists) {
            http_response_code(409);
            echo json_encode(["error" => "Login already exists"]);
            return;
        }

        $roleId = 2;
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $token = bin2hex(random_bytes(16));

        $stmt = $db->prepare("
            INSERT INTO users (login, password_hash, role_id, api_token)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param("ssis", $login, $passwordHash, $roleId, $token);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode([
                "token" => $token,
                "role"  => "user",
                "login" => $login
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Registration failed"]);
        }
        return;
    }

    if ($method === 'POST' && $action === 'login') {
        $body = getJsonBody();
        $login = trim($body['login'] ?? '');
        $password = $body['password'] ?? '';

        if (!$login || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Missing login or password"]);
            return;
        }

        $stmt = $db->prepare("
            SELECT u.id, u.login, u.password_hash, r.name AS role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.login = ?
            LIMIT 1
        ");
        $stmt->bind_param("s", $login);
        $stmt->execute();
        $res = $stmt->get_result();
        $user = $res->fetch_assoc();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(["error" => "Invalid credentials"]);
            return;
        }

        $token = bin2hex(random_bytes(16));
        $up = $db->prepare("UPDATE users SET api_token = ? WHERE id = ?");
        $up->bind_param("si", $token, $user['id']);
        $up->execute();

        echo json_encode([
            "token" => $token,
            "role"  => $user['role'],
            "login" => $user['login']
        ]);
        return;
    }

    if ($method === 'GET' && $action === 'me') {
        echo json_encode([
            "role"  => $authUser['role'],
            "login" => $authUser['login'],
            "id"    => $authUser['id']
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}

function handleCars($method, $id, $db, $authUser) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $db->prepare("
                    SELECT c.*, b.name AS brand_name
                    FROM cars c
                    JOIN brands b ON c.brand_id = b.id
                    WHERE c.id = ?
                ");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $car = $result->fetch_assoc();
                if ($car) echo json_encode($car);
                else {
                    http_response_code(404);
                    echo json_encode(["error" => "Car not found"]);
                }
            } else {
                $res = $db->query("
                    SELECT c.*, b.name AS brand_name
                    FROM cars c
                    JOIN brands b ON c.brand_id = b.id
                    ORDER BY c.id DESC
                ");
                $cars = [];
                while ($row = $res->fetch_assoc()) $cars[] = $row;
                echo json_encode($cars);
            }
            break;

        case 'POST':
            requireAdmin($authUser);
            $body = getJsonBody();
            if (!isset($body['brand_id'], $body['model'], $body['year'], $body['price'])) {
                http_response_code(422);
                echo json_encode(["error" => "Missing required fields"]);
                return;
            }

            $equipment = $body['equipment'] ?? '';
            $photo     = $body['photo_url'] ?? '';

            $stmt = $db->prepare("
                INSERT INTO cars (brand_id, model, year, price, equipment, photo_url)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param(
                "isidss",
                $body['brand_id'],
                $body['model'],
                $body['year'],
                $body['price'],
                $equipment,
                $photo
            );
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["id" => $db->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Insert failed"]);
            }
            break;

        case 'PUT':
            requireAdmin($authUser);
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID required"]);
                return;
            }
            $body = getJsonBody();
            $equipment = $body['equipment'] ?? '';
            $photo     = $body['photo_url'] ?? '';

            $stmt = $db->prepare("
                UPDATE cars
                SET brand_id = ?, model = ?, year = ?, price = ?, equipment = ?, photo_url = ?
                WHERE id = ?
            ");
            $stmt->bind_param(
                "isidssi",
                $body['brand_id'],
                $body['model'],
                $body['year'],
                $body['price'],
                $equipment,
                $photo,
                $id
            );
            if ($stmt->execute()) echo json_encode(["status" => "updated"]);
            else {
                http_response_code(500);
                echo json_encode(["error" => "Update failed"]);
            }
            break;

        case 'DELETE':
            requireAdmin($authUser);
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID required"]);
                return;
            }
            $stmt = $db->prepare("DELETE FROM cars WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) echo json_encode(["status" => "deleted"]);
            else {
                http_response_code(500);
                echo json_encode(["error" => "Delete failed"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
    }
}

function handleBrands($method, $id, $db, $authUser) {
    simpleCrud('brands', ['name'], $method, $id, $db, $authUser);
}

function handleOptions($method, $id, $db, $authUser) {
    simpleCrud('options', ['name', 'price'], $method, $id, $db, $authUser);
}

function handleClients($method, $id, $db, $authUser) {
    simpleCrud('clients', ['fullname', 'phone', 'email'], $method, $id, $db, $authUser);
}

function handleSales($method, $id, $db, $authUser) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $db->prepare("
                    SELECT s.*,
                           CONCAT(b.name, ' ', c.model, ' (', c.year, ')') AS car_name,
                           cl.fullname AS client_name
                    FROM sales s
                    JOIN cars c   ON s.car_id = c.id
                    JOIN brands b ON c.brand_id = b.id
                    JOIN clients cl ON s.client_id = cl.id
                    WHERE s.id = ?
                ");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $res = $stmt->get_result();
                $row = $res->fetch_assoc();
                if ($row) echo json_encode($row);
                else {
                    http_response_code(404);
                    echo json_encode(["error" => "Not found"]);
                }
            } else {
                $res = $db->query("
                    SELECT s.*,
                           CONCAT(b.name, ' ', c.model, ' (', c.year, ')') AS car_name,
                           cl.fullname AS client_name
                    FROM sales s
                    JOIN cars c   ON s.car_id = c.id
                    JOIN brands b ON c.brand_id = b.id
                    JOIN clients cl ON s.client_id = cl.id
                    ORDER BY s.id DESC
                ");
                $items = [];
                while ($r = $res->fetch_assoc()) $items[] = $r;
                echo json_encode($items);
            }
            break;

        case 'POST':
            requireAdmin($authUser);
            $body = getJsonBody();
            $stmt = $db->prepare("
                INSERT INTO sales (car_id, client_id, sale_date, base_price, options_price, total_price)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param(
                "iisdss",
                $body['car_id'],
                $body['client_id'],
                $body['sale_date'],
                $body['base_price'],
                $body['options_price'],
                $body['total_price']
            );
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["id" => $db->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Insert failed"]);
            }
            break;

        case 'PUT':
            requireAdmin($authUser);
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID required"]);
                return;
            }
            $body = getJsonBody();
            $stmt = $db->prepare("
                UPDATE sales
                SET car_id = ?, client_id = ?, sale_date = ?, base_price = ?, options_price = ?, total_price = ?
                WHERE id = ?
            ");
            $stmt->bind_param(
                "iisdssi",
                $body['car_id'],
                $body['client_id'],
                $body['sale_date'],
                $body['base_price'],
                $body['options_price'],
                $body['total_price'],
                $id
            );
            if ($stmt->execute()) echo json_encode(["status" => "updated"]);
            else {
                http_response_code(500);
                echo json_encode(["error" => "Update failed"]);
            }
            break;

        case 'DELETE':
            requireAdmin($authUser);
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID required"]);
                return;
            }
            $stmt = $db->prepare("DELETE FROM sales WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) echo json_encode(["status" => "deleted"]);
            else {
                http_response_code(500);
                echo json_encode(["error" => "Delete failed"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
    }
}

function handleInquiries($method, $id, $db, $authUser) {
    switch ($method) {
        case 'GET':
            requireAdmin($authUser);
            $res = $db->query("
                SELECT i.*, u.login
                FROM inquiries i
                JOIN users u ON i.user_id = u.id
                ORDER BY i.id DESC
            ");
            $items = [];
            while ($r = $res->fetch_assoc()) $items[] = $r;
            echo json_encode($items);
            break;

        case 'POST':
            requireUserOrAdmin($authUser);
            $body    = getJsonBody();
            $fullname = trim($body['fullname'] ?? '');
            $phone    = trim($body['phone'] ?? '');
            $message  = trim($body['message'] ?? '');

            if (!$fullname || !$message) {
                http_response_code(422);
                echo json_encode(["error" => "Required fields missing"]);
                return;
            }

            $userId = $authUser['id'];
            $stmt = $db->prepare("
                INSERT INTO inquiries (user_id, fullname, phone, message)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->bind_param("isss", $userId, $fullname, $phone, $message);

            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["id" => $db->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["error" => "Insert failed"]);
            }
            break;

        case 'DELETE':
            requireAdmin($authUser);
            if (!$id) {
                http_response_code(400);
                echo json_encode(["error" => "ID required"]);
                return;
            }
            $stmt = $db->prepare("DELETE FROM inquiries WHERE id = ?");
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) echo json_encode(["status" => "deleted"]);
            else {
                http_response_code(500);
                echo json_encode(["error" => "Delete failed"]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
    }
}

$authUser = getAuthUser($mysqli);
header('X-Auth-Role: ' . ($authUser['role'] ?? 'none'));

switch ($resource) {
    case 'auth':
        handleAuth($method, $action, $mysqli, $authUser);
        break;
    case 'cars':
        handleCars($method, $id, $mysqli, $authUser);
        break;
    case 'brands':
        handleBrands($method, $id, $mysqli, $authUser);
        break;
    case 'options':
        handleOptions($method, $id, $mysqli, $authUser);
        break;
    case 'clients':
        handleClients($method, $id, $mysqli, $authUser);
        break;
    case 'sales':
        handleSales($method, $id, $mysqli, $authUser);
        break;
    case 'inquiries':
        handleInquiries($method, $id, $mysqli, $authUser);
        break;
    default:
        http_response_code(404);
        echo json_encode(["error" => "Not found"]);
}