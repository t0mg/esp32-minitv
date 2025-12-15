
#pragma once

#include "VideoSource.h"
#include <string>
#include <vector>

class SDCard;
class AVIParser;

class SDCardVideoSource : public VideoSource {
private:
  std::vector<std::string> mAviFiles;
  // AVIParser *mCurrentChannelAudioParser = NULL;
  AVIParser *mCurrentChannelVideoParser = NULL;
  SDCard *mSDCard;
  const char *mAviPath;
  int mFrameCount = 0;
  int mCurrentWsFrameLength = 0;
  unsigned long mLastFrameTime = 0;
  volatile bool mWrapped = false;

public:
  SDCardVideoSource(SDCard *sdCard, const char *aviPath);
  void start();
  bool fetchChannelData();
  int getChannelCount() { return mAviFiles.size(); };
  std::string getChannelName();
  // AVIParser *getAudioParser()
  // {
  //     return mCurrentChannelAudioParser;
  // };
  // see superclass for documentation
  bool getVideoFrame(uint8_t **buffer, size_t &bufferLength,
                     size_t &frameLength);
  void setChannel(int channel);
  void nextChannel();
  bool consumeWrapped() {
    bool wrapped = mWrapped;
    mWrapped = false;
    return wrapped;
  }
};
