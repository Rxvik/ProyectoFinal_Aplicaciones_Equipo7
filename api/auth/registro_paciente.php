<?php
    
    require_once '../config/headers.php';
    require_once '../config/db.php';

    $datos_recibidos = json_decode(file_get_contents('php://input'),true);

    $nombre = trim($datos_recibidos['fullname']);
    $email = trim($datos_recibidos['email']);
    $password = trim($datos_recibidos['password']);

    if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 6) {
        http_response_code(422);
        echo json_encode([
            'ok' => false,
            'message' => 'Datos Invalidos'
        ]);
        exit;
    }

    $consulta = $conexion->prepare("SELECT id_usuario FROM usuarios WHERE email = ?");
    $consulta->execute([$email]);   
    
    if ($consulta->rowCount() > 0) {
        echo json_encode(['status' => false, 'message' => 'El correo ya existe']);
        exit;
    }

    try {
        $conexion->beginTransaction();

        $contrasena_encriptada = password_hash($password, PASSWORD_DEFAULT);

        $sql_usuario = "INSERT INTO usuarios (email, password, rol) VALUES (?, ?, 'paciente')";
        $consulta = $conexion->prepare($sql_usuario);
        $consulta->execute([$email, $contrasena_encriptada]);
        
        $id_nuevo_usuario = $conexion->lastInsertId();

        $sql_paciente = "INSERT INTO pacientes (id_usuario, nombre_completo) VALUES (?, ?)";
        $consulta = $conexion->prepare($sql_paciente);
        $consulta->execute([$id_nuevo_usuario, $nombre]);

        $conexion->commit();
        echo json_encode(['status' => true, 'message' => 'Registro exitoso']);

    } catch (PDOException $error) {
        $conexion->rollBack();
        echo json_encode(['status' => false, 'message' => 'Error: ' . $error->getMessage()]);
    }   



