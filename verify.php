<?php
/**
 * MSD&W Integrated Holdings - Paystack Callback Verification
 * Author: Senior Full-Stack Developer
 */

require_once 'db_connect.php';
require_once 'mailer.php';

define('PAYSTACK_SECRET_KEY', getenv('PAYSTACK_SECRET_KEY') ?: 'sk_test_placeholder_key');

$reference = isset($_GET['reference']) ? filter_var($_GET['reference'], FILTER_SANITIZE_STRING) : null;

if (!$reference) {
    die("No transaction reference provided.");
}

/**
 * Verifies transaction status with Paystack API
 */
function verifyPaystackTransaction($reference) {
    $url = "https://api.paystack.co/transaction/verify/" . rawurlencode($reference);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer " . PAYSTACK_SECRET_KEY,
        "Cache-Control: no-cache",
    ]);
    
    $result = curl_exec($ch);
    curl_close($ch);

    return json_decode($result, true);
}

// 1. Verify with Paystack
$response = verifyPaystackTransaction($reference);

if ($response && isset($response['status']) && $response['status'] && $response['data']['status'] === 'success') {
    
    $amount_paid = $response['data']['amount'] / 100; // Convert back to Naira
    $customer_email = $response['data']['customer']['email'];
    $order_id = $response['data']['metadata']['order_id'] ?? null;

    try {
        // 2. Start Secure Database Transaction
        $pdo->beginTransaction();

        // Check if order exists and is pending
        $stmt = $pdo->prepare("SELECT id, status FROM orders WHERE payment_reference = :ref LIMIT 1");
        $stmt->execute(['ref' => $reference]);
        $order = $stmt->fetch();

        if ($order && $order['status'] === 'Pending') {
            // 3. Update Order Status
            $updateStmt = $pdo->prepare("UPDATE orders SET status = 'Paid' WHERE id = :id");
            $updateStmt->execute(['id' => $order['id']]);

            $pdo->commit();

            // 4. Trigger Domain Email Confirmation
            $subject = "Order Confirmation - MSD&W Integrated Holdings";
            $message = "
                <h2>Payment Successful!</h2>
                <p>Dear Customer, your payment of ₦" . number_format($amount_paid, 2) . " for Order #{$order['id']} has been received.</p>
                <p>Reference: {$reference}</p>
                <p>Our logistics team is now processing your request.</p>
                <br>
                <p>Thank you for choosing MSD&W Integrated Holdings.</p>
            ";
            
            sendMSDWEmail($customer_email, $subject, $message);

            // Redirect to a success page on the frontend
            header("Location: /#/dashboard?payment=success&ref=" . $reference);
            exit();

        } else {
            $pdo->rollBack();
            // Order might already be processed
            header("Location: /#/dashboard?payment=already_processed");
            exit();
        }

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Verification Database Error: " . $e->getMessage());
        die("Internal server error during transaction verification.");
    }

} else {
    // Payment failed or was canceled
    header("Location: /#/products?payment=failed");
    exit();
}
?>