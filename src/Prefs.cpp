#include "Prefs.h"

const char *Prefs::PREF_NAMESPACE = "minitv";
const char *Prefs::PREF_SSID = "ssid";
const char *Prefs::PREF_PASS = "pass";
const char *Prefs::PREF_BRIGHTNESS = "brightness";
const char *Prefs::PREF_OSD_LEVEL = "osd_level";

Prefs::Prefs() {}

void Prefs::begin()
{
  if (!preferences.begin(PREF_NAMESPACE, false))
  {
    Serial.println("Failed to initialize preferences. Clearing and re-initializing.");
    preferences.clear();
    if (!preferences.begin(PREF_NAMESPACE, false))
    {
      Serial.println("Failed to initialize preferences even after clearing.");
    }
  }
}

String Prefs::getSsid()
{
  return readStringPreference(PREF_SSID);
}

void Prefs::setSsid(const String &ssid)
{
  writeStringPreference(PREF_SSID, ssid);
}

String Prefs::getPass()
{
  return readStringPreference(PREF_PASS);
}

void Prefs::setPass(const String &pass)
{
  writeStringPreference(PREF_PASS, pass);
}

int Prefs::getBrightness()
{
  return readIntPreference(PREF_BRIGHTNESS, 255); // Default brightness to 255
}

void Prefs::setBrightness(int brightness)
{
  writeIntPreference(PREF_BRIGHTNESS, brightness);
  if (brightness_changed_callback)
  {
    brightness_changed_callback(brightness);
  }
}

void Prefs::onBrightnessChanged(std::function<void(int)> callback)
{
  brightness_changed_callback = callback;
}

int Prefs::getOsdLevel()
{
  return readIntPreference(PREF_OSD_LEVEL, 1); // Default to standard OSD level
}

void Prefs::setOsdLevel(int level)
{
  writeIntPreference(PREF_OSD_LEVEL, level);
}

String Prefs::readStringPreference(const char *key, const String &defaultValue)
{
  return preferences.getString(key, defaultValue);
}

void Prefs::writeStringPreference(const char *key, const String &value)
{
  preferences.putString(key, value);
}

int Prefs::readIntPreference(const char *key, int defaultValue)
{
  return preferences.getInt(key, defaultValue);
}

void Prefs::writeIntPreference(const char *key, int value)
{
  preferences.putInt(key, value);
}