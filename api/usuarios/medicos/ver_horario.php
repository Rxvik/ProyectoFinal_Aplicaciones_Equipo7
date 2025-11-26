<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_medico.php';

    try {
        
        $sql_medico = "SELECT id_medico FROM medicos WHERE id_usuario = ?";
        $consulta_medico = $conexion->prepare($sql_medico);
        $consulta_medico->execute([$_SESSION['id_usuario']]);
        $id_medico = $consulta_medico->fetch()['id_medico'];

        $sql_horarios = "SELECT dia_semana, hora_inicio, hora_fin 
                        FROM horarios_medicos 
                        WHERE id_medico = ?
                        ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo')";
        
        $consulta_horarios = $conexion->prepare($sql_horarios);
        $consulta_horarios->execute([$id_medico]);
        $lista = $consulta_horarios->fetchAll();

        echo json_encode(['status' => true, 'data' => $lista]);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => $error->getMessage()]);
    }
