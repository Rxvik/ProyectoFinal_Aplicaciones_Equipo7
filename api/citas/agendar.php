<?php

    require_once '../config/headers.php';
    require_once '../config/db.php';
    require_once '../config/verificar_paciente.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'), true);

    $id_medico_elegido = $datos_recibidos['id_medico'];
    $fecha_cita        = $datos_recibidos['fecha'];
    $hora_cita         = $datos_recibidos['hora'];

    try {
        
        $sql_buscar_paciente = "SELECT id_paciente FROM pacientes WHERE id_usuario = ?";
        $consulta = $conexion->prepare($sql_buscar_paciente);
        $consulta->execute([$_SESSION['id_usuario']]);
        
        $paciente_encontrado = $consulta->fetch();
        
        if (!$paciente_encontrado) {
            throw new Exception("Error: No se encontró tu perfil de paciente.");
        }
        
        $id_paciente_real = $paciente_encontrado['id_paciente'];

        $sql_verificar = "SELECT id_cita FROM citas 
                        WHERE id_medico = ? AND fecha_cita = ? AND hora_cita = ? AND estado != 'cancelada'";
        
        $consulta_verificacion = $conexion->prepare($sql_verificar);
        $consulta_verificacion->execute([$id_medico_elegido, $fecha_cita, $hora_cita]);

        if ($consulta_verificacion->rowCount() > 0) {
            echo json_encode(['status' => false, 'message' => 'Ese horario ya está ocupado. Por favor elige otro.']);
            exit;
        }

        $sql_insertar = "INSERT INTO citas (id_paciente, id_medico, fecha_cita, hora_cita, estado) 
                        VALUES (?, ?, ?, ?, 'pendiente')";
        
        $consulta_insertar = $conexion->prepare($sql_insertar);
        $consulta_insertar->execute([$id_paciente_real, $id_medico_elegido, $fecha_cita, $hora_cita]);

        echo json_encode(['status' => true, 'message' => '¡Cita agendada con éxito!']);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }

