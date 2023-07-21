FROM maven:3.9.3-amazoncorretto-17 AS BUILDER
WORKDIR /app
COPY . /app
RUN mvn clean package install 

FROM amazoncorretto:17-alpine-jdk
WORKDIR /
COPY --from=BUILDER /app/target/*.jar app.jar

ENV PORT 8080
EXPOSE ${PORT}
CMD ["java","-jar","app.jar","-Dserver.port=${PORT}"]