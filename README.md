# ImgCast Discord Plugin

An Obsidian plugin that allows you to upload images directly to Discord channels using webhooks. Right-click on any image in Obsidian and upload it to your configured Discord channel instantly.

## Features

- **Right-click Context Menu**: Upload images directly from the file explorer, editor, or image viewer
- **Editor Integration**: Upload images from markdown image links using the context menu
- **Customizable Username**: Set a custom username that appears when uploading to Discord
- **Multiple Image Formats**: Supports PNG, JPG, JPEG, GIF, WebP, BMP, and SVG files
- **Instant Notifications**: Get immediate feedback on upload success or failure
- **Simple Configuration**: Easy setup with Discord webhook URL

## Installation

### Manual Installation

1. Download the latest release from the [Releases](https://github.com/your-username/obsidian-imgcast-discord-plugin/releases) page
2. Extract the downloaded ZIP file
3. Copy the extracted folder to your Obsidian plugins directory:
   - **Windows**: `%APPDATA%\Obsidian\plugins\`
   - **macOS**: `~/Library/Application Support/Obsidian/plugins/`
   - **Linux**: `~/.config/obsidian/plugins/`
4. Enable the plugin in Obsidian under `Settings > Community Plugins`

### Using Obsidian BRAT

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Go to `Settings > BRAT Plugins`
3. Add this repository URL and click "Add Plugin"
4. Enable the plugin once installed

## Setup

1. **Create a Discord Webhook**:
   - Open your Discord server settings
   - Go to "Integrations" → "Webhooks"
   - Click "New Webhook"
   - Choose the channel where you want images to be posted
   - Copy the webhook URL

2. **Configure the Plugin**:
   - Go to `Settings > Community Plugins > ImgCast Discord`
   - Enter your Discord webhook URL
   - Optionally, set a custom username (default: "ImgCast Bot")
   - Save your settings

## Usage

### Method 1: File Explorer
1. Right-click on any image file in the Obsidian file explorer
2. Select "Upload to Discord" from the context menu
3. The image will be uploaded to your configured Discord channel

### Method 2: Editor Context Menu
1. In a markdown note, right-click on a line containing an image link (e.g., `![alt](image.png)`)
2. Select "Upload image to Discord" from the context menu
3. The linked image will be uploaded to Discord

### Method 3: Image Viewer
1. Open any image in the Obsidian image viewer
2. Right-click on the displayed image
3. Select "Upload to Discord" from the custom context menu
4. The image will be uploaded to your Discord channel

## Supported Image Formats

- PNG (.png)
- JPEG (.jpg, .jpeg)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- SVG (.svg)

## Building from Source

If you want to build the plugin yourself:

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/obsidian-imgcast-discord-plugin.git
   cd obsidian-imgcast-discord-plugin
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Development Build**:
   ```bash
   npm run dev
   ```
   This will start the development server with file watching and inline sourcemaps.

4. **Production Build**:
   ```bash
   npm run build
   ```
   This will create an optimized production build in `main.js`.

5. **Version Bump**:
   ```bash
   npm run version
   ```
   This will update the version in `manifest.json` and `versions.json`.

### Development Scripts

- `npm run dev` - Start development build with watching
- `npm run build` - Create production build
- `npm run version` - Bump version numbers

## Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| Discord Webhook URL | The webhook URL for your Discord channel | (empty) |
| Username | The username that appears when uploading images | "ImgCast Bot" |

## Troubleshooting

### Upload Fails
- Ensure your webhook URL is correct and hasn't expired
- Check that you have permission to post in the target Discord channel
- Verify the image file is not corrupted

### Context Menu Not Appearing
- Make sure the file has a supported image extension
- Try restarting Obsidian
- Check that the plugin is enabled in settings

### Large Images
- Discord has a file size limit (typically 8MB for uploads)
- Large images may fail to upload; consider resizing them first

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit your changes: `git commit -m "Add some feature"`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This plugin is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0
- Initial release
- Right-click context menu for image uploads
- File explorer integration
- Editor context menu for markdown image links
- Image viewer context menu
- Customizable webhook URL and username
- Support for multiple image formats

## Support

If you encounter any issues or have suggestions:
- Open an issue on the [GitHub repository](https://github.com/your-username/obsidian-imgcast-discord-plugin/issues)
- Check the [discussions](https://github.com/your-username/obsidian-imgcast-discord-plugin/discussions) for questions

## Acknowledgments

- Built with [Obsidian API](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
- Uses [esbuild](https://esbuild.github.io/) for bundling
- Inspired by the Obsidian community's need for easy image sharing