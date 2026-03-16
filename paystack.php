<?php
/**
 * MSD&W Integrated Holdings - Paystack Transaction Initiation
 * Author: Senior Full-Stack Developer
 */

require_once 'db_connect.php';

// Ensure the secret key is defined (usually in .env or server config)
define('PAYSTACK_SECRET_KEY', getenv('PAYSTACK_SECRET_KEY') ?: 'sk_test_placeholder_key');

/**
 * Initiates a Paystack transaction and redirects the user
 * 
 * @param string $email Customer email
 * @param float $amount Amount in Naira
 * @param string $reference Unique transaction reference
 * @param int $order_id Local database order ID
 */
function initiatePaystackPayment($email, $amount, $reference, $order_id) {
    $url = "https://api.paystack.co/transaction/initialize";
    
    // Paystack expects amount in kobo (Naira * 100)
    $amount_in_kobo = (int)($amount * 100);
    
    $fields = [
        'email' => $email,
        'amount' => $amount_in_kobo,
        'reference' => $reference,
        // Ensure this matches your live domain or development proxy
        'callback_url' => "https://msdw.com/verify.php",
        'metadata' => [
            'order_id' => $order_id,
            'custom_fields' => [
                [
                    'display_name' => "Order ID",
                    'variable_name' => "order_id",
                    'value' => $order_id
                ]
            ]
        ]
    ];

    $fields_string = json_encode($fields);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $fields_string);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "Authorization: Bearer " . PAYSTACK_SECRET_KEY,
        "Cache-Control: no-cache",
        "Content-Type: application/json"
    ));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true); 

    $result = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
        error_log("CURL Error in Paystack Initiation: " . $error);
        return ['status' => false, 'message' => 'Connection to payment gateway failed.'];
    }

    return json_decode($result, true);
}

// Logic to handle incoming checkout requests from the frontend
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Basic Input Sanitization
    $email = filter_var($_POST['email'], FILTER_SANITIZE_EMAIL);
    $amount = filter_var($_POST['amount'], FILTER_VALIDATE_FLOAT);
    $order_id = filter_var($_POST['order_id'], FILTER_VALIDATE_INT);

    if (!$email || !$amount || !$order_id) {
        die("Invalid transaction parameters.");
    }

    // Generate unique reference for Paystack
    $reference = "MSDW_" . $order_id . "_" . bin2hex(random_bytes(4));

    // Update the local order with the payment reference before redirecting
    try {
        $stmt = $pdo->prepare("UPDATE orders SET payment_reference = :ref WHERE id = :id");
        $stmt->execute(['ref' => $reference, 'id' => $order_id]);
    } catch (PDOException $e) {
        error_log("DB Error updating reference: " . $e->getMessage());
        die("System error preparing transaction.");
    }

    // Call Paystack
    $response = initiatePaystackPayment($email, $amount, $reference, $order_id);

    if ($response && isset($response['status']) && $response['status']) {
        // Redirect to Paystack Checkout Page
        header("Location: " . $response['data']['authorization_url']);
        exit();
    } else {
        $msg = $response['message'] ?? 'Unknown Error';
        error_log("Paystack Initiation Failed: " . $msg);
        die("Payment Gateway Error: " . $msg);
    }
}
?>