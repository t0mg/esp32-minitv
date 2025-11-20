# merge_firmware.py
#
# This script is executed by PlatformIO as a post-build action.
# It uses esptool.py to merge the bootloader, partition table, boot app,
# and application binary into a single "factory" binary.
# This is necessary for web-based flashers like ESP Web Tools.

import os
import sys
from subprocess import run

Import("env")

def merge_bin(source, target, env):
    """
    Merges the built binaries into a single flashable file.
    """
    print("Running merge_bin.py post-build script...")

    # Get the path to esptool.py from the PlatformIO toolchain
    esptool_path = os.path.join(
        env.PioPlatform().get_package_dir("tool-esptoolpy"),
        "esptool.py",
    )

    # Get configuration from the build environment
    build_dir = env.subst("$BUILD_DIR")
    chip = env.get("BOARD_MCU")
    flash_mode = env.get("BOARD_BUILD.FLASH_MODE", "dio")

    # The board_upload.flash_size from platformio.ini is the most reliable source
    flash_size_str = env.get("BOARD_UPLOAD.FLASH_SIZE", "16MB")

    # Convert f_flash (e.g., "80000000L") to flash frequency string (e.g., "80m")
    f_flash = env.get("BOARD_BUILD.F_FLASH", "80000000L")
    flash_freq = str(int(f_flash.replace("L", "")) // 1000000) + "m"

    # Define the output path for the merged binary
    output_path = os.path.join(build_dir, "firmware-factory.bin")

    # Define the command arguments for esptool.py
    # Offsets are based on the standard partition scheme for ESP32-S3
    command = [
        sys.executable,
        esptool_path,
        "--chip",
        chip,
        "merge_bin",
        "-o",
        output_path,
        "--flash_mode",
        flash_mode,
        "--flash_freq",
        flash_freq,
        "--flash_size",
        flash_size_str,
        "0x0", os.path.join(build_dir, "bootloader.bin"),
        "0x8000", os.path.join(build_dir, "partitions.bin"),
        "0xe000", os.path.join(build_dir, "boot_app0.bin"),
        "0x10000", os.path.join(build_dir, "firmware.bin"),
    ]

    print("Merging binaries with command:")
    print(" ".join(command))

    # Execute the command
    result = run(command, capture_output=True, text=True)

    if result.returncode != 0:
        print("Error: Failed to merge binaries.")
        print(f"Exit Code: {result.returncode}")
        print("--- stdout ---")
        print(result.stdout)
        print("--- stderr ---")
        print(result.stderr)
        env.Exit(1)
    else:
        print(f"Successfully merged binaries to {output_path}")
        print(result.stdout)

# Register the 'merge_bin' function as a post-build action for the firmware.bin target.
# This ensures the script runs automatically after a successful build.
env.AddPostAction("$BUILD_DIR/firmware.bin", merge_bin)
