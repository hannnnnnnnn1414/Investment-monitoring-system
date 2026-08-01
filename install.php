<?php
/**
 * Installer — membuat database, tabel, dan seed data.
 * Jalankan sekali: http://localhost/Investment-monitoring-system/install.php
 */

require __DIR__ . '/config.php';

$sqlFile = __DIR__ . '/database/db.sql';

if (!is_cli()) {
    header('Content-Type: text/html; charset=utf-8');
    echo '<pre style="font-family:Consolas,monospace;background:#17181C;color:#E9EAEE;padding:24px;border-radius:12px;">';
}

echo "Investment Monitoring System — Installer\n";
echo "=======================================\n\n";

if (!file_exists($sqlFile)) {
    exit("ERROR: file database/db.sql tidak ditemukan.\n");
}

try {
    // Koneksi tanpa nama database (untuk CREATE DATABASE / USE)
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    $sql = file_get_contents($sqlFile);

    // Buang baris komentar sebelum dipisah per-statement,
    // agar statement pertama (CREATE DATABASE) tidak ikut ter-skip.
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    $ok = 0;
    foreach ($statements as $stmt) {
        if ($stmt === '') {
            continue;
        }
        $pdo->exec($stmt);
        $ok++;
    }

    // Gunakan DB lalu verifikasi
    $count = $pdo->query('SELECT COUNT(*) FROM ' . DB_NAME . '.investments')->fetchColumn();

    echo "[OK] $ok perintah SQL dijalankan.\n";
    echo "[OK] Database 'investment_monitoring' siap.\n";
    echo "[OK] Seed data: $count baris investasi.\n\n";

    if (is_cli()) {
        echo "Instalasi berhasil.\n";
    } else {
        echo "<strong style=\"color:#1FA463\">Instalasi berhasil!</strong>\n\n";
        echo "Lanjut ke aplikasi: <a href=\"index.html\" style=\"color:#E33D48\">Buka Dashboard</a>\n";
    }
} catch (Throwable $e) {
    if (!is_cli()) {
        echo "<strong style=\"color:#D2232A\">Instalasi gagal</strong>\n\n";
    }
    echo 'ERROR: ' . $e->getMessage() . "\n";
    if (!is_cli()) {
        echo "\nPastikan MySQL di Laragon sedang running dan kredensial di config.php benar.\n";
    }
    exit(1);
}

if (!is_cli()) {
    echo '</pre>';
}
