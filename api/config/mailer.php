<?php

    function enviar_correo($destinatario, $asunto, $mensaje) {

        $fecha = date('Y-m-d H:i:s');
        
        $contenido = "==================================================\n";
        $contenido .= "📧 NUEVO CORREO ENVIADO ($fecha)\n";
        $contenido .= "PARA:    $destinatario\n";
        $contenido .= "ASUNTO:  $asunto\n";
        $contenido .= "MENSAJE:\n$mensaje\n";
        $contenido .= "==================================================\n\n";

        $ruta_log = '../../email_log.txt';

        file_put_contents($ruta_log, $contenido, FILE_APPEND);

        return true;
    }
