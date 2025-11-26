<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_admin.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'), true);

    $accion = $datos_recibidos['accion'] ?? $_GET['accion'] ?? 'listar';

    try {
        switch ($accion) {
            
            case 'listar':
                $sql_listar = "SELECT p.id_paciente, p.nombre_completo, p.telefono, u.email, u.fecha_creacion 
                            FROM pacientes p
                            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
                            ORDER BY p.nombre_completo ASC";
                
                $consulta = $conexion->query($sql_listar);
                echo json_encode(['status' => true, 'data' => $consulta->fetchAll()]);
                break;

            case 'eliminar':
                if (empty($datos_recibidos['id_paciente'])) {
                    throw new Exception("Falta el ID del paciente");
                }

                $sql_buscar = "SELECT id_usuario FROM pacientes WHERE id_paciente = ?";
                $consulta = $conexion->prepare($sql_buscar);
                $consulta->execute([$datos_recibidos['id_paciente']]);
                $paciente = $consulta->fetch();

                if (!$paciente) {
                    throw new Exception("Paciente no encontrado");
                }

                $sql_borrar = "DELETE FROM usuarios WHERE id_usuario = ?";
                $consulta_borrar = $conexion->prepare($sql_borrar);
                $consulta_borrar->execute([$paciente['id_usuario']]);

                echo json_encode(['status' => true, 'message' => 'Paciente eliminado correctamente']);
                break;

            default:
                throw new Exception("Acción no válida");
        }

    } catch (Exception $error) {
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => $error->getMessage()]);
    }
