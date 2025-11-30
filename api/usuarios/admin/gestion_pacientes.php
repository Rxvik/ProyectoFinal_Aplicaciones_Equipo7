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

            case 'crear':
                if (empty($datos_recibidos['nombre']) || empty($datos_recibidos['email']) || empty($datos_recibidos['password'])) {
                    throw new Exception("Faltan datos obligatorios (Nombre, Email o Contraseña)");
                }

                $sql_verificar = "SELECT id_usuario FROM usuarios WHERE email = ?";
                $consulta_verificar = $conexion->prepare($sql_verificar);
                $consulta_verificar->execute([$datos_recibidos['email']]);

                if ($consulta_verificar->rowCount() > 0) {
                    throw new Exception("El correo electrónico ya está registrado");
                }

                $conexion->beginTransaction();

                $password_encriptada = password_hash($datos_recibidos['password'], PASSWORD_DEFAULT);
                
                $sql_usuario = "INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, 'paciente')";
                $consulta_usuario = $conexion->prepare($sql_usuario);
                $consulta_usuario->execute([$datos_recibidos['email'], $password_encriptada]);
                
                $id_nuevo_usuario = $conexion->lastInsertId();

                $sql_paciente = "INSERT INTO pacientes (id_usuario, nombre_completo, telefono) VALUES (?, ?, ?)";
                $consulta_paciente = $conexion->prepare($sql_paciente);
                $consulta_paciente->execute([
                    $id_nuevo_usuario, 
                    $datos_recibidos['nombre'], 
                    $datos_recibidos['telefono'] ?? null
                ]);

                $conexion->commit();
                echo json_encode(['status' => true, 'message' => 'Paciente registrado correctamente']);
                break;   

            default:
                throw new Exception("Acción no válida");
        }

    } catch (Exception $error) {
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => $error->getMessage()]);
    }
