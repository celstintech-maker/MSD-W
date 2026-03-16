
<?php
/**
 * MSD&W Integrated Holdings - Secure DB Connection
 * Uses PDO for prepared statements and security against SQL Injection.
 */

$host = 'localhost';
$db   = 'msdw_holdings';
$user = 'msdw_db_user';
$pass = 'secure_password_here';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERR_MODE            => PDO::ERR_MODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE  => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     // Log error privately and show a generic message to user
     error_log($e->getMessage());
     die("System error. Please try again later.");
}
?>
