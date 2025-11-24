<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';

    try {
        $sql = "SELECT id_medico, nombre_completo, especialidad 
                FROM medicos 
                ORDER BY nombre_completo ASC";
                
        $consulta = $conexion->prepare($sql);
        $consulta->execute();
        
        $lista_medicos = $consulta->fetchAll();

        echo json_encode([
            'status' => true,
            'data' => $lista_medicos
        ]);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }
