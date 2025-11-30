<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_medico.php';

    try {
        
        $sql_medico = "SELECT id_medico, nombre_completo FROM medicos WHERE id_usuario = ?";
        $consulta = $conexion->prepare($sql_medico);
        $consulta->execute([$_SESSION['id_usuario']]);
        $medico = $consulta->fetch();
        
        if (!$medico) {
            echo json_encode(['status' => false, 'message' => 'Médico no encontrado']);
            exit;
        }
        
        $id_medico = $medico['id_medico'];

        $sql_citas = "SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado, 
                                COALESCE(p.nombre_completo, 'Usuario Eliminado') as paciente, 
                                p.telefono
                        FROM citas c
                        LEFT JOIN pacientes p ON c.id_paciente = p.id_paciente
                        WHERE c.id_medico = ? 
                        ORDER BY c.fecha_cita ASC, c.hora_cita ASC";

        $consulta_citas = $conexion->prepare($sql_citas);
        $consulta_citas->execute([$id_medico]);
        $todas_las_citas = $consulta_citas->fetchAll();

        $total_hoy = 0;
        $total_completadas = 0;
        $proxima_cita = null;
        
        foreach ($todas_las_citas as $cita) {
            if ($cita['fecha_cita'] === $fecha_hoy) {
                if ($cita['estado'] !== 'cancelada') $total_hoy++;
                if ($cita['estado'] === 'completada') $total_completadas_hoy++;
            }

            if ($proxima_cita === null) {
                if (($cita['estado'] === 'pendiente' || $cita['estado'] === 'confirmada') && 
                    $cita['fecha_cita'] >= $fecha_hoy) {
                    
                    $proxima_cita = $cita;
                }
            }
        }

        echo json_encode([
            'status' => true,
            'medico' => $medico['nombre_completo'],
            'resumen' => [
                'citas_hoy' => $total_hoy,
                'atendidos_hoy' => $total_completadas,
                'proxima_cita' => $proxima_cita
            ],
            'lista_completa' => $todas_las_citas
        ]);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }
