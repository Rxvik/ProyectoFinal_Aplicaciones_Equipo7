<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_admin.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'), true);

    $accion = $datos_recibidos['accion'] ?? $_GET['accion'] ?? 'listar';

    try {
        switch ($accion) {
            
            case 'listar':
                $sql_listar = "SELECT m.id_medico, m.nombre_completo, m.especialidad, m.telefono, u.email 
                            FROM medicos m
                            INNER JOIN usuarios u ON m.id_usuario = u.id_usuario
                            ORDER BY m.nombre_completo ASC";
                
                $consulta = $conexion->query($sql_listar);
                
                echo json_encode(['status' => true, 'data' => $consulta->fetchAll()]);
                break;

            case 'crear':
                if (empty($datos_recibidos['nombre']) || empty($datos_recibidos['email']) || empty($datos_recibidos['password']) || empty($datos_recibidos['especialidad'])) {
                    throw new Exception("Faltan datos obligatorios");
                }

                $consulta = $conexion->prepare("SELECT id_usuario FROM usuarios WHERE email = ?");
                $consulta->execute([$datos_recibidos['email']]);
                if ($consulta->rowCount() > 0) throw new Exception("El correo ya existe");

                $conexion->beginTransaction();

                $pass_encriptada = password_hash($datos_recibidos['password'], PASSWORD_DEFAULT);
                $sql_usuario = "INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, 'medico')";
                
                $consulta = $conexion->prepare($sql_usuario);
                $consulta->execute([$datos_recibidos['email'], $pass_encriptada]);
                $id_nuevo_usuario = $conexion->lastInsertId();

                $sql_medico = "INSERT INTO medicos (id_usuario, nombre_completo, especialidad, telefono) VALUES (?, ?, ?, ?)";
                $consulta = $conexion->prepare($sql_medico);
                $consulta->execute([
                    $id_nuevo_usuario, 
                    $datos_recibidos['nombre'], 
                    $datos_recibidos['especialidad'], 
                    $datos_recibidos['telefono'] ?? null
                ]);

                $conexion->commit();
                echo json_encode(['status' => true, 'message' => 'Médico registrado correctamente']);
                break;

            case 'editar':
                if (empty($datos_recibidos['id_medico']) || empty($datos_recibidos['nombre']) || empty($datos_recibidos['especialidad'])) {
                    throw new Exception("Faltan datos para editar");
                }

                $sql_editar = "UPDATE medicos SET nombre_completo = ?, especialidad = ?, telefono = ? WHERE id_medico = ?";
                $consulta = $conexion->prepare($sql_editar);
                $consulta->execute([
                    $datos_recibidos['nombre'], 
                    $datos_recibidos['especialidad'], 
                    $datos_recibidos['telefono'] ?? null, 
                    $datos_recibidos['id_medico']
                ]);

                echo json_encode(['status' => true, 'message' => 'Datos actualizados']);
                break;

            case 'eliminar':
                if (empty($datos_recibidos['id_medico'])) throw new Exception("Falta el ID del médico");

                $consulta = $conexion->prepare("SELECT id_usuario FROM medicos WHERE id_medico = ?");
                $consulta->execute([$datos_recibidos['id_medico']]);
                $medico_encontrado = $consulta->fetch();

                if (!$medico_encontrado) throw new Exception("Médico no encontrado");

                $consulta = $conexion->prepare("DELETE FROM usuarios WHERE id_usuario = ?");
                $consulta->execute([$medico_encontrado['id_usuario']]);

                echo json_encode(['status' => true, 'message' => 'Médico eliminado del sistema']);
                break;

            default:
                throw new Exception("Acción no válida");
        }

    } catch (Exception $error) {
        if ($conexion->inTransaction()) $conexion->rollBack();
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => $error->getMessage()]);
    }
