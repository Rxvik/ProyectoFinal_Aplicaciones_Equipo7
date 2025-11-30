<?php

    require_once '../config/headers.php';
    require_once '../config/db.php';
    require_once '../config/verificar_paciente.php';
    require_once '../config/mailer.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'), true);

    $id_medico = $datos_recibidos['id_medico'];
    $fecha_cita        = $datos_recibidos['fecha'];
    $hora_cita         = $datos_recibidos['hora'];

    try {
        
        $sql_buscar_paciente = "SELECT p.id_paciente, p.nombre_completo, u.email 
                        FROM pacientes p 
                        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario 
                        WHERE p.id_usuario = ?";
        $consulta = $conexion->prepare($sql_buscar_paciente);
        $consulta->execute([$_SESSION['id_usuario']]);
        
        $paciente_encontrado = $consulta->fetch();
        
        if (!$paciente_encontrado) {
            throw new Exception("Error: No se encontró tu perfil de paciente.");
        }
        
        $id_paciente = $paciente_encontrado['id_paciente'];
        $nombre_paciente = $paciente_encontrado['nombre_completo'];
        $email_paciente  = $paciente_encontrado['email'];

        $sql_doctor = "SELECT nombre_completo FROM medicos WHERE id_medico = ?";
        $consulta_doctor = $conexion->prepare($sql_doctor);
        $consulta_doctor->execute([$id_medico]);
        $info = $consulta_doctor->fetch();
        $nombre_doctor = $info['nombre_completo'] ?? 'Médico';

        $dias_semana = [
            1 => 'Lunes', 2 => 'Martes', 3 => 'Miercoles', 
            4 => 'Jueves', 5 => 'Viernes', 6 => 'Sabado', 7 => 'Domingo'
        ];
        
        $numero_dia = date('N', strtotime($fecha_cita));
        $nombre_dia = $dias_semana[$numero_dia];

        $sql_horario = "SELECT hora_inicio, hora_fin 
                        FROM horarios_medicos 
                        WHERE id_medico = ? AND dia_semana = ?";
        
        $consulta_horario = $conexion->prepare($sql_horario);
        $consulta_horario->execute([$id_medico, $nombre_dia]);
        $horario_lab = $consulta_horario->fetch();

        if (!$horario_lab) {
            echo json_encode(['status' => false, 'message' => "El médico no trabaja los $nombre_dia."]);
            exit;
        }

        $inicio = strtotime($horario_lab['hora_inicio']);
        $fin    = strtotime($horario_lab['hora_fin']);
        $cita  = strtotime($hora_cita);

        if ($cita < $inicio || $cita >= $fin) {
            echo json_encode([
                'status' => false, 
                'message' => "El médico solo atiende de " . $horario_lab['hora_inicio'] . " a " . $horario_lab['hora_fin']
            ]);
            exit;
        }

        $sql_verificar = "SELECT id_cita FROM citas 
                        WHERE id_medico = ? AND fecha_cita = ? AND hora_cita = ? AND estado != 'cancelada'";
        
        $consulta_verificacion = $conexion->prepare($sql_verificar);
        $consulta_verificacion->execute([$id_medico, $fecha_cita, $hora_cita]);

        if ($consulta_verificacion->rowCount() > 0) {
            echo json_encode(['status' => false, 'message' => 'Ese horario ya está ocupado. Por favor elige otro.']);
            exit;
        }

        $sql_insertar = "INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, estado) 
                        VALUES (?, ?, ?, ?, 'confirmada')";
        
        $consulta_insertar = $conexion->prepare($sql_insertar);
        $consulta_insertar->execute([$id_paciente, $id_medico, $fecha_cita, $hora_cita]);

        $asunto = "Confirmación de Cita - Papuclinica";
        $mensaje = "Hola $nombre_paciente,\n\n";
        $mensaje .= "Tu cita ha sido agendada exitosamente.\n";
        $mensaje .= "👨‍⚕️ Médico: $nombre_doctor\n";
        $mensaje .= "📅 Fecha: $fecha_cita\n";
        $mensaje .= "⏰ Hora: $hora_cita\n\n";
        $mensaje .= "Gracias por confiar en nosotros.";

        enviar_correo($email_paciente, $asunto, $mensaje);

        echo json_encode(['status' => true, 'message' => '¡Cita agendada con éxito!']);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }

