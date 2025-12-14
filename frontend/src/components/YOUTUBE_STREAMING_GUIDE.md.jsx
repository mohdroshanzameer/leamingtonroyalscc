# YouTube Live Streaming Guide for Cricket Matches

## Overview
This guide explains how to live stream cricket matches on YouTube using your club's app with professional scoreboard overlays powered by OBS Studio.

---

## What You'll Need

### Software Requirements
- **OBS Studio** (Free) - Download from [obsproject.com](https://obsproject.com/)
  - Alternative: Streamlabs Desktop
- **Web Browser** - Chrome, Firefox, or Edge
- **Your Club App** - Access to the Scoring page

### Hardware Requirements
- Computer with decent processing power (Intel i5 or equivalent)
- Stable internet connection (minimum 5 Mbps upload speed)
- Camera (optional) - Webcam, phone camera, or external camera
- Microphone (optional but recommended)

---

## Step-by-Step Setup Guide

### Part 1: Prepare Your Match in the App

1. **Start Match Scoring**
   - Open your club's app
   - Navigate to **Scoring** page
   - Select the match you want to stream
   - Complete the toss and start scoring

2. **Access Stream Overlays**
   - Look for the **Stream Overlay** button (TV icon)
   - Click to open the Live Stream Overlays dialog

3. **Configure Your Overlay**
   - **Choose Layout**: 
     - Full Scoreboard - Complete match info
     - Minimal - Compact score display
     - Ticker - Bottom bar style
   
   - **Select Theme**:
     - Default (Dark)
     - Blue
     - Red
     - Green
   
   - **Add Sponsor Logo** (Optional):
     - Enter the URL of your sponsor's logo
     - Logo will appear on the overlay

4. **Copy Overlay URLs**
   - Each layout generates a unique URL
   - Click the **Copy** button next to your preferred layout
   - Keep this URL handy for OBS setup

---

### Part 2: Set Up OBS Studio

#### Initial OBS Configuration

1. **Install and Launch OBS**
   - Download from obsproject.com
   - Install and open the application
   - Complete the Auto-Configuration Wizard if prompted

2. **Create a Scene**
   - In the **Scenes** panel (bottom-left), click `+`
   - Name it "Cricket Match Stream"
   - Click OK

#### Add Video Sources

3. **Add Camera Feed** (Optional)
   ```
   Sources → + → Video Capture Device
   - Name: "Match Camera"
   - Select your camera device
   - Adjust resolution (1920x1080 recommended)
   ```

4. **Add Game/Match Capture** (If streaming recorded video)
   ```
   Sources → + → Display Capture or Window Capture
   - Name: "Match Video"
   - Select the appropriate display/window
   ```

#### Add the Scoreboard Overlay

5. **Add Browser Source for Scoreboard**
   ```
   Sources → + → Browser
   - Name: "Live Scoreboard"
   ```

6. **Configure Browser Source**
   - **URL**: Paste the overlay URL you copied from the app
   - **Width**: `1920`
   - **Height**: `1080`
   - **FPS**: `30`
   - ✅ Check "Shutdown source when not visible"
   - ✅ Check "Refresh browser when scene becomes active"
   - Click OK

7. **Position Your Overlay**
   - The scoreboard appears in the preview window
   - Drag and resize to your preferred position
   - Common positions:
     - Top of screen (full width)
     - Bottom ticker style
     - Corner overlay

#### Arrange Your Layout

8. **Layer Your Sources** (Order matters!)
   - Drag sources in the Sources panel to reorder
   - Recommended order (top to bottom):
     1. Live Scoreboard (Browser Source)
     2. Webcam/Commentary (if using)
     3. Match Video/Capture

9. **Test the Overlay**
   - Go back to your app and record some balls
   - Watch the scoreboard update live in OBS
   - Adjust positioning if needed

---

### Part 3: Connect to YouTube

#### Get Your YouTube Stream Key

1. **Open YouTube Studio**
   - Go to [studio.youtube.com](https://studio.youtube.com)
   - Click **Create** → **Go Live**
   - Select **Stream** tab

2. **Configure Stream Settings**
   - **Title**: "Live Cricket Match - [Team A] vs [Team B]"
   - **Description**: Add match details, teams, competition
   - **Category**: Sports
   - **Visibility**: 
     - Public (anyone can watch)
     - Unlisted (only people with link)
     - Private (invitation only)

3. **Copy Stream Key**
   - Find "Stream key" in YouTube Studio
   - Click **Copy** or **Reveal** and copy it
   - **IMPORTANT**: Keep this private!

#### Connect OBS to YouTube

4. **Configure OBS Streaming Settings**
   ```
   OBS → Settings → Stream
   - Service: YouTube - RTMPS
   - Server: Primary YouTube ingest server
   - Stream Key: [Paste your YouTube stream key]
   - Click Apply → OK
   ```

5. **Configure Output Settings**
   ```
   OBS → Settings → Output
   - Output Mode: Simple
   - Video Bitrate: 4500 Kbps (adjust based on internet speed)
   - Encoder: Hardware (NVENC) or x264
   - Audio Bitrate: 160
   ```

6. **Configure Video Settings**
   ```
   OBS → Settings → Video
   - Base Resolution: 1920x1080
   - Output Resolution: 1920x1080
   - FPS: 30 or 60 (30 recommended for cricket)
   ```

---

### Part 4: Start Streaming

1. **Final Checks**
   - ✅ Camera/video feed working
   - ✅ Scoreboard overlay displaying correctly
   - ✅ Audio levels good (if using microphone)
   - ✅ Internet connection stable

2. **Start the Stream**
   - In OBS, click **Start Streaming**
   - OBS will connect to YouTube
   - Status shows "Live" when connected

3. **Monitor Your Stream**
   - Open YouTube Studio in a browser
   - View the stream dashboard
   - Check viewer count and chat
   - Monitor stream health

4. **Score the Match**
   - Use your app's Scoring page normally
   - Record balls, wickets, and extras
   - Scoreboard updates automatically in real-time
   - Viewers see live updates within 10-15 seconds

5. **End the Stream**
   - Complete the match in your app
   - In OBS, click **Stop Streaming**
   - YouTube will process the recording
   - Video available for replay immediately

---

## Pro Tips for Better Streams

### Performance Optimization

- **Close unnecessary programs** while streaming
- **Use wired ethernet** instead of WiFi
- **Lower video quality** if you experience lag
- **Monitor CPU usage** in OBS stats
- **Restart OBS** between streams for best performance

### Visual Enhancements

- **Add Commentary**: Use a microphone for live commentary
- **Custom Branding**: Add your club logo as an image source
- **Lower Thirds**: Add text overlays for player names, milestones
- **Transitions**: Use OBS transitions between scenes
- **Background Music**: Add subtle music during breaks (check copyright!)

### Audio Setup

- **Use External Microphone**: Better than built-in laptop mic
- **Adjust Audio Levels**: Keep commentary clear but not too loud
- **Monitor Audio**: Use headphones to check audio quality
- **Reduce Echo**: Record in a quiet room with soft surfaces

### Engagement

- **Interact with Chat**: Respond to viewer questions
- **Show Replays**: Use OBS scenes to show key moments
- **Post-Match Analysis**: Keep streaming for 5-10 mins after match
- **Promote in Advance**: Share stream link on social media
- **Schedule Streams**: Use YouTube's scheduling feature

---

## Troubleshooting Common Issues

### Scoreboard Not Updating

**Problem**: Overlay shows but doesn't update with new scores

**Solutions**:
1. Refresh the browser source in OBS (right-click → Refresh)
2. Check that you're scoring balls in the app
3. Verify you copied the correct URL
4. Ensure internet connection is stable
5. Try removing and re-adding the browser source

### Stream Lagging/Buffering

**Problem**: Stream is choppy for viewers

**Solutions**:
1. Lower video bitrate in OBS (try 3000 Kbps)
2. Reduce output resolution to 1280x720
3. Change encoder preset to "faster"
4. Close other internet-using applications
5. Test your upload speed (speedtest.net)

### Audio Out of Sync

**Problem**: Audio doesn't match video

**Solutions**:
1. Right-click audio source → Advanced Audio Properties
2. Add sync offset (usually +100 to +500 ms)
3. Restart OBS
4. Check audio device sample rate matches OBS settings

### Stream Key Invalid

**Problem**: OBS won't connect to YouTube

**Solutions**:
1. Verify you copied the entire stream key
2. Generate a new stream key in YouTube Studio
3. Check you selected "YouTube - RTMPS" in OBS
4. Ensure YouTube account is verified for live streaming

### High CPU Usage

**Problem**: Computer is slow during streaming

**Solutions**:
1. Change encoder to NVENC (if you have NVIDIA GPU)
2. Lower video resolution
3. Use "faster" or "veryfast" encoder preset
4. Close background applications
5. Upgrade your computer hardware

---

## Recommended Stream Settings

### For Good Internet (10+ Mbps upload)
- **Resolution**: 1920x1080 (Full HD)
- **FPS**: 30 or 60
- **Bitrate**: 4500-6000 Kbps
- **Encoder**: NVENC H.264 or x264

### For Medium Internet (5-10 Mbps upload)
- **Resolution**: 1280x720 (HD)
- **FPS**: 30
- **Bitrate**: 3000-4000 Kbps
- **Encoder**: NVENC H.264 or x264 (faster)

### For Slower Internet (3-5 Mbps upload)
- **Resolution**: 1280x720 (HD)
- **FPS**: 30
- **Bitrate**: 2000-2500 Kbps
- **Encoder**: x264 (veryfast preset)

---

## Advanced Features

### Multiple Camera Angles

1. Add multiple Video Capture Devices
2. Create separate scenes for each angle
3. Switch scenes during breaks or replays
4. Use hotkeys for quick switching

### Picture-in-Picture (PiP)

1. Add multiple video sources to same scene
2. Resize one source smaller
3. Position in corner for PiP effect
4. Great for showing scorer + match simultaneously

### Custom Scoreboard Themes

1. Use different overlay URLs for different themes
2. Create multiple browser sources
3. Toggle visibility based on match phase
4. Match your club's branding colors

### Instant Replays

1. Install OBS Replay Buffer plugin
2. Configure replay duration
3. Use hotkey to save last 30 seconds
4. Switch to replay scene to show it

---

## Mobile Streaming Alternative

If you don't have a computer available, you can use mobile streaming:

### Option 1: YouTube Mobile App
- Use YouTube app's built-in streaming
- Manually show scoreboard by switching between apps
- Less professional but works in a pinch

### Option 2: Streamlabs Mobile
- Download Streamlabs Mobile app
- Add browser source (overlay URL)
- Stream directly from phone
- Limited features compared to desktop

**Note**: Desktop streaming with OBS gives much better quality and more control.

---

## Getting Help

### Resources
- **OBS Documentation**: [obsproject.com/wiki](https://obsproject.com/wiki/)
- **YouTube Creator Academy**: [creatoracademy.youtube.com](https://creatoracademy.youtube.com)
- **OBS Forums**: [obsproject.com/forum](https://obsproject.com/forum/)

### Test Your Setup
- Do a **private test stream** before going live
- Verify everything works correctly
- Check stream quality on different devices
- Ask friends to review and give feedback

---

## Quick Reference Card

### Pre-Stream Checklist
- [ ] Match selected in app
- [ ] Scoring started
- [ ] Overlay URL copied
- [ ] OBS scene configured
- [ ] Browser source added with URL
- [ ] YouTube stream key entered
- [ ] Test stream successful
- [ ] Audio levels checked
- [ ] Internet connection stable

### During Stream
- [ ] Monitor stream health in YouTube Studio
- [ ] Check chat for viewer questions
- [ ] Ensure scoring continues in app
- [ ] Watch for any technical issues
- [ ] Keep commentary engaging

### Post-Stream
- [ ] Stop streaming in OBS
- [ ] Save match scorecard
- [ ] Download stream recording from YouTube
- [ ] Share highlights on social media
- [ ] Review viewer feedback

---

## Legal Considerations

### Copyright
- Only stream matches you have permission to broadcast
- Don't use copyrighted music without license
- Respect player privacy and consent
- Follow your cricket league's broadcasting rules

### YouTube Guidelines
- Follow YouTube Community Guidelines
- Respect copyright and fair use
- Don't stream misleading or harmful content
- Enable age restrictions if needed

---

## Conclusion

With this setup, you can provide professional live cricket streaming with real-time scoreboard overlays to your club's fans, families, and supporters worldwide. The overlay updates automatically as you score, creating an engaging viewing experience.

**Remember**: Practice makes perfect. Do a few test streams before your important matches to get comfortable with the workflow.

Good luck with your streams! 🏏📺

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**For Support**: Contact your club administrator or app support team