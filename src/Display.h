#pragma once

#include <Arduino.h>
#include <TFT_eSPI.h>
#include "Prefs.h"
#include "OSD.h"
#include "freertos/semphr.h"

class Prefs;

class Display
{
private:
  TFT_eSPI *tft;
  TFT_eSprite *frameSprite;
  Prefs *_prefs;
  uint16_t *dmaBuffer[2] = {NULL, NULL};
  int dmaBufferIndex = 0;
  SemaphoreHandle_t tft_mutex;

public:
  Display(Prefs *prefs);
  void setBrightness(uint8_t brightness);
  void drawPixels(int x, int y, int width, int height, uint16_t *pixels);
  void drawPixelsToSprite(int x, int y, int width, int height, uint16_t *pixels);
  void flushSprite();
  void fillSprite(uint16_t color);
  int width();
  int height();
  void fillScreen(uint16_t color);
  void drawOSD(const char *text, OSDPosition position, OSDLevel level);
  void drawSDCardFailed();
  static uint16_t color565(uint8_t r, uint8_t g, uint8_t b)
  {
    return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
  }
};

namespace DisplayColors
{
  static const uint16_t BLACK = Display::color565(0, 0, 0);
}
