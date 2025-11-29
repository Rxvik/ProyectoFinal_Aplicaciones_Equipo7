<?php
    require_once '../config/headers.php';
    require_once '../config/db.php';

    try {
        $sql = "SELECT id_medico, nombre_completo, especialidad FROM medicos ORDER BY nombre_completo ASC";
        
        $consulta = $conexion->prepare($sql);
        $consulta->execute();
        
        $medicos = $consulta->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode([
            'status' => true,
            'medicos' => $medicos
        ]);

    } catch (PDOException $error) {
        http_response_code(500);
        echo json_encode([
            'status' => false,
            'message' => 'Error al obtener especialidades: ' . $error->getMessage()
        ]);
    }
?>