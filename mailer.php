
<?php
/**
 * PHPMailer Configuration for MSD&W domain email
 */
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

function sendMSDWEmail($to, $subject, $body) {
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'mail.msdw.com'; // cPanel SMTP Host
        $mail->SMTPAuth   = true;
        $mail->Username   = 'info@msdw.com';
        $mail->Password   = 'your_cpanel_email_password';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = 468;

        // Recipients
        $mail->setFrom('info@msdw.com', 'MSD&W Integrated Holdings');
        $mail->addAddress($to);

        // Content
        $mail->isHTML(true);
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>
