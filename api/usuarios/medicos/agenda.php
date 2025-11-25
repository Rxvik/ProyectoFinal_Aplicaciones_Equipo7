<?php

    require_once '../config/headers.php';
    require_once '../config/db.php';
    require_once '../config/verificar_medico.php';

    try {

        $sql_medico = "SELECT id_medico FROM medicos WHERE id_usuario = ?";
        $consulta = $conexion->prepare($sql_medico);
        $consulta->execute([$_SESSION['id_usuario']]);
        $id_medico = $consulta->fetch()['id_medico'];

        $sql_cita = "SELECT c.id_cita, c.fecha_cita, c.hora_cita, p.nombre_completo 
                FROM citas c
                INNER JOIN pacientes p ON c.id_paciente = p.id_paciente
                WHERE c.id_medico = ? AND c.estado != 'cancelada'";
                
        $consulta_cita = $conexion->prepare($sql_cita);
        $consulta_cita->execute([$id_medico]);
        $citas = $consulta_cita->fetchAll();

        $eventos = [];
        foreach($citas as $c) {
            $eventos[] = [
                'id'    => $c['id_cita'],
                'title' => $c['nombre_completo'],
                'start' => $c['fecha_cita'] . 'T' . $c['hora_cita'],
                'color' => '#3788d8'
            ];
        }

        echo json_encode($eventos);

    } catch (Exception $error) {
        echo json_encode([]);
    }