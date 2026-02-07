# Greenhouse Project

## Project Overview
This is a Java-based project named **greenhouse**. It is a modern Java application leveraging recent Java features (Java 25 LTS). The project uses a standard Gradle-based structure.

### Key Technologies
- **Java**: Version 25 (LTS)
- **Build System**: Gradle
- **Testing Framework**: JUnit Jupiter (configured)

## Building and Running
The project uses the Gradle wrapper for consistent builds.

- **Build the project**:
  ```bash
  ./gradlew build
  ```
- **Run the application**:
  Currently, the `application` plugin is not applied in `build.gradle`. To run the application, you can use:
  ```bash
  ./gradlew classes
  java -cp build/classes/java/main org.dined.dined.Main
  ```
  *Note: The project uses modern Java features like `IO.println` and instance main methods.*

- **Run tests**:
  ```bash
  ./gradlew test
  ```

## Development Conventions
- **Source Code**: Located in `src/main/java`.
- **Package Structure**: Follows `org.dined.dined`.
- **Main Entry Point**: `src/main/java/org/dined/dined/Main.java`.
- **Tests**: Should be placed in `src/test/java` using JUnit 5.
- **Dependencies**: Managed via `build.gradle`.
