<?php
/**
 * API — Investment Monitoring System (PT Kayaba)
 *
 * Routes:
 *   GET  api.php?r=investments            -> daftar investasi
 *   POST api.php?r=investments            -> tambah investasi baru (status Draft)
 *   POST api.php?r=update                 -> update progres / pembayaran investasi
 *   GET  api.php?r=actions                -> daftar tindakan perbaikan
 *   POST api.php?r=actions                -> tambah tindakan perbaikan
 *   POST api.php?r=action-status          -> update status tindakan
 */

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$route  = $_GET['r'] ?? '';

function json_out($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function required(array $in, array $keys, string $route): void
{
    foreach ($keys as $k) {
        if (!isset($in[$k]) || $in[$k] === '') {
            json_out(['error' => "Field '$k' wajib diisi."], 422);
        }
    }
}

try {
    $pdo = db();

    switch ($route) {

        case 'investments':
            if ($method === 'GET') {
                $rows = $pdo
                    ->query('SELECT id, code, name, pic, category, purpose, stage, budget, used,
                                    invest_progress, pay_step, pay_dp, pay_1, pay_2, pay_3, pay_retention,
                                    budget_status, closed_at, fs_target, fs_actual, rate, created_at
                             FROM investments ORDER BY id ASC')
                    ->fetchAll();
                foreach ($rows as &$r) {
                    $r['budget']       = (float) $r['budget'];
                    $r['used']         = (float) $r['used'];
                    $r['pay_dp']       = (float) $r['pay_dp'];
                    $r['pay_1']        = (float) $r['pay_1'];
                    $r['pay_2']        = (float) $r['pay_2'];
                    $r['pay_3']        = (float) $r['pay_3'];
                    $r['pay_retention']= (float) $r['pay_retention'];
                    $r['fs_target']    = (float) $r['fs_target'];
                    $r['fs_actual']    = (float) $r['fs_actual'];
                }
                json_out($rows);
            }

            if ($method === 'POST') {
                $in = body();
                required($in, ['name', 'pic', 'category'], 'investments');

                $budget = (float) ($in['budget'] ?? 0);
                $fsTarget = (float) ($in['fs_target'] ?? 0);
                $purpose = $in['purpose'] ?? 'Umum';

                // Auto-generate kode berikutnya: INV-011, INV-012, ...
                $st = $pdo->query("SELECT MAX(CAST(SUBSTRING(code, 5) AS UNSIGNED)) AS mx
                                   FROM investments WHERE code LIKE 'INV-%'");
                $next = ((int) $st->fetch()['mx']) + 1;
                $code = 'INV-' . str_pad((string) $next, 3, '0', STR_PAD_LEFT);

                $st = $pdo->prepare(
                    'INSERT INTO investments (code, name, pic, category, purpose, stage, budget, fs_target)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
                );
                $st->execute([$code, $in['name'], $in['pic'], $in['category'], $purpose, 'Draft', $budget, $fsTarget]);

                json_out(['ok' => true, 'id' => (int) $pdo->lastInsertId(), 'code' => $code], 201);
            }
            break;

        case 'update':
            if ($method === 'POST') {
                $in = body();
                required($in, ['id'], 'update');

                $fields = ['invest_progress' => 'invest_progress', 'pay_step' => 'pay_step',
                           'pay_dp' => 'pay_dp', 'pay_1' => 'pay_1', 'pay_2' => 'pay_2',
                           'pay_3' => 'pay_3', 'pay_retention' => 'pay_retention',
                           'budget_status' => 'budget_status',
                           'used' => 'used', 'rate' => 'rate', 'stage' => 'stage'];
                $sets = [];
                $vals = [];
                foreach ($fields as $k => $col) {
                    if (isset($in[$k]) && $in[$k] !== '') {
                        $sets[] = "$col = ?";
                        $vals[] = $in[$k];
                    }
                }
                if (isset($in['budget_status']) && $in['budget_status'] === 'closed') {
                    $sets[] = 'closed_at = NOW()';
                } elseif (isset($in['budget_status']) && $in['budget_status'] === 'open') {
                    $sets[] = 'closed_at = NULL';
                }
                if (!$sets) {
                    json_out(['error' => 'Tidak ada field yang akan diupdate.'], 422);
                }
                $vals[] = (int) $in['id'];
                $st = $pdo->prepare('UPDATE investments SET ' . implode(', ', $sets) . ' WHERE id = ?');
                $st->execute($vals);
                json_out(['ok' => true, 'affected' => $st->rowCount()]);
            }
            break;

        case 'actions':
            if ($method === 'GET') {
                $rows = $pdo
                    ->query('SELECT a.id, a.investment_id, i.code, i.name AS inv_name,
                                    a.action, a.owner, a.due_date, a.status
                             FROM actions a
                             JOIN investments i ON i.id = a.investment_id
                             ORDER BY FIELD(a.status, \'open\', \'in-progress\', \'done\'), a.due_date ASC')
                    ->fetchAll();
                json_out($rows);
            }

            if ($method === 'POST') {
                $in = body();
                required($in, ['investment_id', 'action', 'owner', 'due_date'], 'actions');
                $st = $pdo->prepare(
                    'INSERT INTO actions (investment_id, action, owner, due_date, status)
                     VALUES (?, ?, ?, ?, \'open\')'
                );
                $st->execute([$in['investment_id'], $in['action'], $in['owner'], $in['due_date']]);
                json_out(['ok' => true, 'id' => (int) $pdo->lastInsertId()], 201);
            }
            break;

        case 'action-status':
            if ($method === 'POST') {
                $in = body();
                required($in, ['id', 'status'], 'action-status');
                if (!in_array($in['status'], ['open', 'in-progress', 'done'], true)) {
                    json_out(['error' => 'Status tidak valid.'], 422);
                }
                $st = $pdo->prepare('UPDATE actions SET status = ? WHERE id = ?');
                $st->execute([$in['status'], (int) $in['id']]);
                json_out(['ok' => true, 'affected' => $st->rowCount()]);
            }
            break;

        default:
            json_out(['error' => 'Route tidak dikenal.'], 404);
    }
} catch (Throwable $e) {
    json_out(['error' => $e->getMessage()], 500);
}
