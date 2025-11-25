<?php
    
    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_admin.php';

    $json_input = file_get_contents('php://input');
    $datos_recibidos = json_decode($json_input, true);

    $accion = $datos_recibidos['accion'] ?? $_GET['accion'] ?? 'listar';

    try {
        switch ($accion) {
            
            case 'listar':
                $sql_listar = "SELECT c.id_cita, c.fecha_cita, c.hora_cita, c.estado,
                                    p.nombre_completo as paciente,
                                    m.nombre_completo as medico,
                                    m.especialidad
                                FROM citas c
                                LEFT JOIN pacientes p ON c.id_paciente = p.id_paciente
                                LEFT JOIN medicos m ON c.id_medico = m.id_medico
                                ORDER BY FIELD(c.estado, 'pendiente', 'confirmada', 'completada', 'cancelada'), 
                                        c.fecha_cita ASC, 
                                        c.hora_cita ASC";
                
                $consulta = $conexion->query($sql_listar);
                echo json_encode(['status' => true, 'data' => $consulta->fetchAll()]);
                break;

            case 'editar':
                if (empty($datos_recibidos['id_cita'])) {
                    throw new Exception("Falta el ID de la cita");
                }

                $sql_actual = "SELECT * FROM citas WHERE id_cita = ?";
                $$consulta = $conexion->prepare($sql_actual);
                $$consulta->execute([$datos_recibidos['id_cita']]);
                $cita_actual = $$consulta->fetch();

                if (!$cita_actual) throw new Exception("Cita no encontrada");

                $nuevo_medico = $datos_recibidos['id_medico'] ?? $cita_actual['id_medico'];
                $nueva_fecha  = $datos_recibidos['fecha_cita'] ?? $cita_actual['fecha_cita'];
                $nueva_hora   = $datos_recibidos['hora_cita']  ?? $cita_actual['hora_cita'];
                $nuevo_estado = $datos_recibidos['estado']     ?? $cita_actual['estado'];

                $sql_actualizar = "UPDATE citas SET id_medico = ?, fecha_cita = ?, hora_cita = ?, estado = ? 
                                WHERE id_cita = ?";
                $$consulta_actualizar = $conexion->prepare($sql_actualizar);
                $$consulta_actualizar->execute([$nuevo_medico, $nueva_fecha, $nueva_hora, $nuevo_estado, $datos_recibidos['id_cita']]);

                echo json_encode(['status' => true, 'message' => 'Cita actualizada correctamente']);
                break;

            case 'cancelar':
                if (empty($datos_recibidos['id_cita'])) {
                    throw new Exception("Falta el ID de la cita");
                }

                $sql_cancelar = "UPDATE citas SET estado = 'cancelada' WHERE id_cita = ?";
                $consulta = $conexion->prepare($sql_cancelar);
                $consulta->execute([$datos_recibidos['id_cita']]);

                if ($consulta->rowCount() > 0) {
                    echo json_encode(['status' => true, 'message' => 'Cita cancelada por el Administrador']);
                } else {
                    throw new Exception("No se encontró la cita o ya estaba cancelada");
                }
                break;

            default:
                throw new Exception("Acción no válida");
        }

    } catch (Exception $error) {
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => $error->getMessage()]);
    }
