package com.example.snooper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

@Service
public class SnooperService {

    @Value("${clamd.host}")
    private String host;

    @Value("${clamd.port}")
    private int port;

    @Value("${clamd.timeout}")
    private int timeout;

    public boolean isSafe(InputStream fileInputStream) throws IOException {
        System.out.printf("Connecting to Host '%s' on Port '%s' using timeout '%s' \n", host, port, timeout);

        try (Socket socket = new Socket(host, port);
             OutputStream outputStream = new BufferedOutputStream(socket.getOutputStream())) {

            socket.setSoTimeout(timeout);
            startHandshake(outputStream);

            byte[] part = new byte[2048];
            try (InputStream inputStream = socket.getInputStream()) {
                int bytesRead = fileInputStream.read(part);
                while (bytesRead >= 0) {
                    outputStream.write(ByteBuffer.allocate(4).putInt(bytesRead).array());
                    outputStream.write(part,0, bytesRead);

                    if (inputStream.available() > 0) {
                        throw new IOException("Scanning Failed with Reason: " + serverResponse(inputStream));
                    }
                    bytesRead = fileInputStream.read(part);
                }
                endHandshake(outputStream);
                String response = serverResponse(inputStream);
                return response != null &&
                        response.contains("OK") &&
                        !response.contains("FOUND");
            }
        }
    }

    private void startHandshake(OutputStream outputStream) throws IOException {
        outputStream.write("zINSTREAM\0".getBytes(StandardCharsets.US_ASCII));
        outputStream.flush();
    }

    private void endHandshake(OutputStream outputStream) throws IOException {
        outputStream.write(new byte[]{0,0,0,0});
        outputStream.flush();
    }

    private String serverResponse(InputStream stream) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        stream.transferTo(outputStream);
        return outputStream.toString(StandardCharsets.US_ASCII);
    }
}
