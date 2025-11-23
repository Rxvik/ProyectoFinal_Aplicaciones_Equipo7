<?php

    require_once '../config/headers.php';
    require_once '../config/db.php';
    require_once '../config/verificar_paciente.php';

    try {
        
        $sql_paciente = "SELECT id_paciente FROM pacientes WHERE id_usuario = ?";
        $consulta = $conexion->prepare($sql_paciente);
        $consulta->execute([$_SESSION['id_usuario']]);
        $paciente = $consulta->fetch();

        if (!$paciente) {
            echo json_encode(['status' => false, 'message' => 'Perfil no encontrado']);
            exit;
        }

        $id_paciente = $paciente['id_paciente'];

        $sql_proxima = "SELECT c.fecha_cita, c.hora_cita, m.nombre_completo as medico
                        FROM citas c
                        INNER JOIN medicos m ON c.id_medico = m.id_medico
                        WHERE c.id_paciente = ? 
                        AND c.estado = 'pendiente'
                        AND CONCAT(c.fecha_cita, ' ', c.hora_cita) >= NOW() 
                        ORDER BY c.fecha_cita ASC, c.hora_cita ASC
                        LIMIT 1";

        $consulta_prox = $conexion->prepare($sql_proxima);
        $consulta_prox->execute([$id_paciente]);
        $proxima_cita = $consulta_prox->fetch();

        echo json_encode([
            'status' => true,
            'hay_cita' => ($proxima_cita ? true : false),
            'cita' => $proxima_cita
        ]);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }