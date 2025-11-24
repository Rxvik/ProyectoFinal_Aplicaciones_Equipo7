<?php

    require_once '../config/headers.php';
    require_once '../config/db.php';
    require_once '../config/verificar_medico.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'), true);

    if (!isset($datos_recibidos['id_cita']) || !isset($datos_recibidos['estado'])) {
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => 'Faltan datos (id_cita o estado)']);
        exit;
    }

    $id_cita     = $datos_recibidos['id_cita'];
    $nuevo_estado = $datos_recibidos['estado'];

    $estados_validos = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (!in_array($nuevo_estado, $estados_validos)) {
        echo json_encode(['status' => false, 'message' => 'Estado no válido']);
        exit;
    }

    try {
        
        $sql_medico = "SELECT id_medico FROM medicos WHERE id_usuario = ?";
        $consulta_medico= $conexion->prepare($sql_medico);
        $consulta_medico->execute([$_SESSION['id_usuario']]);
        $medico = $consulta_medico->fetch();
        $id_medico = $medico['id_medico'];

        $sql_actualizar = "UPDATE citas SET estado = ? 
                    WHERE id_cita = ? AND id_medico = ?";
        
        $consulta = $conexion->prepare($sql_actualizar);
        $consulta->execute([$nuevo_estado, $id_cita, $id_medico]);

        if ($consulta->rowCount() > 0) {
            echo json_encode(['status' => true, 'message' => "Cita marcada como $nuevo_estado"]);
        } else {
            echo json_encode(['status' => false, 'message' => 'No se pudo actualizar (¿La cita no es tuya o ya tenía ese estado?)']);
        }

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }
