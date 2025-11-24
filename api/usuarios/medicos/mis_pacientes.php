<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_medico.php';

    try {
        
        $sql_medico = "SELECT id_medico FROM medicos WHERE id_usuario = ?";
        $consulta_medico = $conexion->prepare($sql_medico);
        $consulta_medico->execute([$_SESSION['id_usuario']]);
        
        $medico = $consulta_medico->fetch();
        
        if (!$medico) {
            echo json_encode(['status' => false, 'message' => 'No se encontró perfil de médico']);
            exit;
        }
        
        $id_medico = $medico['id_medico'];

        $sql_pacientes = "SELECT 
                            p.id_paciente,
                            p.nombre_completo,
                            p.telefono,
                            u.email,
                            MAX(c.fecha_cita) as ultima_cita
                        FROM citas c
                        INNER JOIN pacientes p ON c.id_paciente = p.id_paciente
                        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
                        WHERE c.id_medico = ?
                        GROUP BY p.id_paciente, p.nombre_completo, p.telefono, u.email
                        ORDER BY ultima_cita DESC";

        $consulta_pacientes = $conexion->prepare($sql_pacientes);
        $consulta_pacientes->execute([$id_medico]);
        
        $lista_pacientes = $consulta_pacientes->fetchAll();

        echo json_encode([
            'status' => true,
            'cantidad' => count($lista_pacientes),
            'data' => $lista_pacientes
        ]);

    } catch (Exception $error) {
        http_response_code(500);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }
