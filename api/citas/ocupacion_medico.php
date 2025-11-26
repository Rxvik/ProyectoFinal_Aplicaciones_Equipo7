<?php

    require_once '../config/headers.php';
    require_once '../config/db.php';

    $id_medico = $_GET['id_medico'] ?? null;

    if (!$id_medico) {
        echo json_encode([]);
        exit;
    }

    try {
        $sql = "SELECT fecha_cita, hora_cita 
                FROM citas 
                WHERE id_medico = ? AND estado != 'cancelada'";
                
        $consulta = $conexion->prepare($sql);
        $consulta->execute([$id_medico]);
        $citas = $consulta->fetchAll();

        $eventos_ocupados = [];
        
        foreach($citas as $c) {
            $eventos_ocupados[] = [
                'start' => $c['fecha_cita'] . 'T' . $c['hora_cita'],
                'display' => 'background',
                'color'   => '#ff9f89',    
                'title'   => 'Ocupado'     
            ];
        }

        echo json_encode($eventos_ocupados);

    } catch (Exception $error) {
        echo json_encode([]);
    }
?>