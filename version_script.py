import os

# Path to the versioning file
VERSION_FILE = "versioning"

# Read the current build number
if os.path.exists(VERSION_FILE):
    with open(VERSION_FILE, "r") as f:
        try:
            build_number = int(f.read().strip())
        except (ValueError, TypeError):
            build_number = 0
else:
    build_number = 0

# Increment the build number
build_number += 1

# Write the new build number back to the file
with open(VERSION_FILE, "w") as f:
    f.write(str(build_number))

# Print the build number so it can be used by PlatformIO
print(f"-D APP_BUILD_NUMBER={build_number}")
