<?php

    require_once '../config/headers.php';
    require_once '../config/db.php';
    require_once '../config/verificar_paciente.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'), true);

    if (!isset($datos_recibidos['id_cita'])) {
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => 'Falta el ID de la cita']);
        exit;
    }

    $id_cita = $datos_recibidos['id_cita'];

    try {

        $sql_paciente = "SELECT id_paciente FROM pacientes WHERE id_usuario = ?";
        $consulta = $conexion->prepare($sql_paciente);
        $consulta->execute([$_SESSION['id_usuario']]);
        $paciente = $consulta->fetch();
        $id_paciente = $paciente['id_paciente'];

        $sql_cancelar = "UPDATE citas SET estado = 'cancelada' 
                        WHERE id_cita = ? AND id_paciente = ?";
        
        $consulta_cancelar = $conexion->prepare($sql_cancelar);
        $consulta_cancelar->execute([$id_cita, $id_paciente]);

        if ($consulta_cancelar->rowCount() > 0) {
            echo json_encode(['status' => true, 'message' => 'Cita cancelada correctamente']);
        } else {
            echo json_encode(['status' => false, 'message' => 'No se encontró la cita o no tienes permiso para cancelarla']);
        }

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }