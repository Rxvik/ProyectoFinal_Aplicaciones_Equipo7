<?php

    require_once '../../config/headers.php';
    require_once '../../config/db.php';
    require_once '../../config/verificar_paciente.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'), true);

    if (empty($datos_recibidos)) {
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => 'No se recibieron datos para actualizar.']);
        exit;
    }

    $id_usuario = $_SESSION['id_usuario'];

    try {
        $sql_buscar = "SELECT p.nombre_completo, u.email 
                    FROM pacientes p
                    INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
                    WHERE p.id_usuario = ?";
        
        $consulta = $conexion->prepare($sql_buscar);
        $consulta->execute([$id_usuario]);
        $info = $consulta->fetch();

        if (!$info) {
            throw new Exception("No se encontró tu información en el sistema.");
        }

        $nombre_final = !empty($datos_recibidos['fullname']) ? trim($datos_recibidos['fullname']) : $info['nombre_completo'];
        $email_final  = !empty($datos_recibidos['email'])    ? trim($datos_recibidos['email'])    : $info['email'];
        
        $password_nuevo = trim($datos_recibidos['new_password'] ?? '');

        $conexion->beginTransaction();

        if ($email_final !== $info['email']) {
            $sql_verificar = "SELECT id_usuario FROM usuarios WHERE email = ? AND id_usuario != ?";
            $consulta_verificar = $conexion->prepare($sql_verificar);
            $consulta_verificar->execute([$email_final, $id_usuario]);

            if ($consulta_verificar->rowCount() > 0) {
                throw new Exception("El correo $email_final ya está usado por otra persona.");
            }
        }

        if (!empty($password_nuevo)) {
            if (strlen($password_nuevo) < 6) {
                throw new Exception("La nueva contraseña es muy corta (mínimo 6 caracteres).");
            }
            $password_encriptada = password_hash($password_nuevo, PASSWORD_DEFAULT);

            $sql_usuario = "UPDATE usuarios SET email = ?, password_hash = ? WHERE id_usuario = ?";
            $consulta_usuario = $conexion->prepare($sql_usuario);
            $consulta_usuario->execute([$email_final, $password_encriptada, $id_usuario]);
        } else {
            $sql_usuario = "UPDATE usuarios SET email = ? WHERE id_usuario = ?";
            $consulta_usuario = $conexion->prepare($sql_usuario);
            $consulta_usuario->execute([$email_final, $id_usuario]);
        }

        $sql_paciente = "UPDATE pacientes SET nombre_completo = ? WHERE id_usuario = ?";
        $consulta_paciente = $conexion->prepare($sql_paciente);
        $consulta_paciente->execute([$nombre_final, $id_usuario]);

        $conexion->commit();

        $_SESSION['email'] = $email_final;

        echo json_encode(['status' => true, 'message' => 'Perfil actualizado correctamente']);

    } catch (Exception $error) {
        if ($conexion->inTransaction()) {
            $conexion->rollBack();
        }
        
        http_response_code(400);
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }
