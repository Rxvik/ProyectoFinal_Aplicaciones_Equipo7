<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_medico.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'), true);

    if (!is_array($datos_recibidos)) {
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => 'Formato incorrecto']);
        exit;
    }

    try {
        
        $sql_buscar_medico = "SELECT id_medico FROM medicos WHERE id_usuario = ?";
        $consulta_medico = $conexion->prepare($sql_buscar_medico);
        $consulta_medico->execute([$_SESSION['id_usuario']]);
        $id_medico = $consulta_medico->fetch()['id_medico'];

        $conexion->beginTransaction();

        $sql_borrar = "DELETE FROM horarios_medicos WHERE id_medico = ?";
        $consulta_borrar = $conexion->prepare($sql_borrar);
        $consulta_borrar->execute([$id_medico]);

        $sql_insertar = "INSERT INTO horarios_medicos (id_medico, dia_semana, hora_inicio, hora_fin) 
                        VALUES (?, ?, ?, ?)";
        $consulta_insertar = $conexion->prepare($sql_insertar);

        $dias_guardados = 0;

        foreach ($datos_recibidos as $dia) {
            
            if (!empty($dia['dia']) && !empty($dia['inicio']) && !empty($dia['fin'])) {
                
                if ($dia['inicio'] >= $dia['fin']) {
                    throw new Exception("Error en " . $dia['dia'] . ": La hora de salida debe ser después de la entrada.");
                }

                $consulta_insertar->execute([
                    $id_medico,
                    $dia['dia'], 
                    $dia['inicio'], 
                    $dia['fin'] 
                ]);
                $dias_guardados++;
            }
        }

        $conexion->commit();
        echo json_encode(['status' => true, 'message' => "Horario actualizado ($dias_guardados días laborales)."]);

    } catch (Exception $error) {
        if ($conexion->inTransaction()) $conexion->rollBack();
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }