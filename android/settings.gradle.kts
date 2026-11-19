// Marks this directory as its own Gradle build root. Without it, Gradle walks up
// to the monorepo's settings.gradle.kts and tries to build the whole repo.
rootProject.name = "stripe-terminal-react-native"
