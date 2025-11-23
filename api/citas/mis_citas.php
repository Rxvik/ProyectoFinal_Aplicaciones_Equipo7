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

        $sql_citas = "SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado, m.nombre_completo as nombre_medico, m.especialidad
                    FROM citas c
                    INNER JOIN medicos m ON c.id_medico = m.id_medico
                    WHERE c.id_paciente = ?
                    ORDER BY c.fecha_cita DESC, c.hora_cita ASC";

        $consulta_citas = $conexion->prepare($sql_citas);
        $consulta_citas->execute([$id_paciente]);
        
        $lista_citas = $consulta_citas->fetchAll();

        echo json_encode([
            'status' => true,
            'data' => $lista_citas
        ]);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }
