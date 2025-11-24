<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_admin.php';

    try {
        $fecha_hoy = date('Y-m-d');

        $sql_citas_hoy = "SELECT COUNT(*) as total FROM citas WHERE fecha_cita = ?";
        $consulta = $conexion->prepare($sql_citas_hoy);
        $consulta->execute([$fecha_hoy]);
        $citas_hoy = $consulta->fetch()['total'];

        $sql_medicos = "SELECT COUNT(*) as total FROM medicos";
        $consulta = $conexion->query($sql_medicos);
        $medicos_activos = $consulta->fetch()['total'];

        $sql_pacientes = "SELECT COUNT(*) as total FROM pacientes";
        $consulta = $conexion->query($sql_pacientes);
        $pacientes_total = $consulta->fetch()['total'];

        $sql_completadas = "SELECT COUNT(*) as total FROM citas WHERE estado = 'completada'";
        $consulta = $conexion->query($sql_completadas);
        $citas_completadas = $consulta->fetch()['total'];

        echo json_encode([
            'status' => true,
            'resumen' => [
                'citas_hoy' => $citas_hoy,
                'medicos_activos' => $medicos_activos,
                'pacientes_total' => $pacientes_total,
                'citas_completadas' => $citas_completadas
            ]
        ]);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }
