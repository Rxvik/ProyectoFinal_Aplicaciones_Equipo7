<?php

    require_once '../libs/PHPMailer/Exception.php';
    require_once '../libs/PHPMailer/PHPMailer.php';
    require_once '../libs/PHPMailer/SMTP.php';

    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\Exception;

    function enviar_correo($destinatario, $asunto, $mensaje_html) {
        $mail = new PHPMailer(true);

        try {
            
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            
            $mail->Username   = 'clinica0203@gmail.com'; 
            $mail->Password   = 'rqiwmfhecbuvaixd';
            
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            $mail->setFrom('papuclinica@gmail.com', 'Papuclinica Notificaciones');
            $mail->addAddress($destinatario);

            $mail->isHTML(true);
            $mail->CharSet = 'UTF-8'; 
            $mail->Subject = $asunto;
            $mail->Body    = nl2br($mensaje_html); 
            $mail->AltBody = strip_tags($mensaje_html); 

            $mail->send();
            return true;

        } catch (Exception $e) {
            $error_log = __DIR__ . '/../../error_mail.log';
            file_put_contents($error_log, "Error al enviar: {$mail->ErrorInfo}\n", FILE_APPEND);
            return false;
        }
    }


    
