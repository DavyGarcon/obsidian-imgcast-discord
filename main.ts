import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

interface DiscordBot {
	id: string;
	name: string;
	webhookUrl: string;
}

interface ImgCastDiscordSettings {
	bots: DiscordBot[];
}

const DEFAULT_SETTINGS: ImgCastDiscordSettings = {
	bots: []
}

export default class ImgCastDiscordPlugin extends Plugin {
	settings: ImgCastDiscordSettings;

	async onload() {
		await this.loadSettings();

		// This adds a settings tab so the user can configure their webhook URL and username
		this.addSettingTab(new ImgCastDiscordSettingTab(this.app, this));

		// Register event handler for right-click on images
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				this.addImageUploadMenuItem(menu, editor, view);
			})
		);

		// Register event handler for images in file explorer
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu: any, file) => {
				if (file instanceof TFile && this.isImageFile(file)) {
					const bots = this.settings.bots;
					if (bots.length === 0) {
						menu.addItem((item: any) => {
							item.setTitle('Upload to Discord')
								.setIcon('upload')
								.onClick(() => {
									new Notice('Please configure at least one bot in settings');
								});
						});
					} else {
						bots.forEach((bot) => {
							menu.addItem((item: any) => {
								item.setTitle(`Upload to ${bot.name}`)
									.setIcon('upload')
									.onClick(() => this.uploadImageToDiscord(file, bot));
							});
						});
					}
				}
			})
		);

		// Register event handler for opened images (context menu on image viewer)
		this.addImageViewerContextMenu();
	}

	onunload() {

	}

	addImageViewerContextMenu() {
		// Hook into the workspace to add context menu for opened images
		this.registerInterval(
			window.setInterval(() => {
				// Find any image elements that might be displayed
				const images = document.querySelectorAll('img[src]:not([data-imgcast-context])');
				
				images.forEach((img: any) => {
					console.log('Found image:', img.src);
					
					// Also check if this image is in a viewer modal or has special attributes
					const viewer = img.closest('.image-viewer, .modal, .popup');
					if (viewer) {
						console.log('Image is in viewer:', viewer.className);
					}
					
					// Mark this image as processed
					img.setAttribute('data-imgcast-context', 'true');
					
					// Add context menu event listener
					img.addEventListener('contextmenu', (e: MouseEvent) => {
						e.preventDefault();
						e.stopPropagation();
						
						// Create context menu
						const menu = this.createImageContextMenu(img);
						document.body.appendChild(menu);
						
						// Position menu at mouse location
						menu.style.left = e.pageX + 'px';
						menu.style.top = e.pageY + 'px';
						
						// Remove menu when clicking elsewhere
						const removeMenu = () => {
							menu.remove();
							document.removeEventListener('click', removeMenu);
						};
						
						setTimeout(() => {
							document.addEventListener('click', removeMenu);
						}, 100);
					});
				});
			}, 1000)
		);
	}

	createImageContextMenu(img: HTMLImageElement) {
		const menu = document.createElement('div');
		menu.className = 'imgcast-context-menu';
		menu.style.cssText = `
			position: fixed;
			background: var(--background-primary);
			border: 1px solid var(--background-modifier-border);
			border-radius: 6px;
			padding: 4px 0;
			box-shadow: var(--shadow-s);
			z-index: 10000;
			min-width: 180px;
		`;

		const bots = this.settings.bots;

		if (bots.length === 0) {
			const menuItem = document.createElement('div');
			menuItem.style.cssText = `
				padding: 8px 12px;
				cursor: pointer;
				display: flex;
				align-items: center;
				gap: 8px;
				color: var(--text-muted);
				font-size: var(--font-ui-small);
			`;
			menuItem.innerHTML = `
				<span style="width: 16px; height: 16px; display: inline-block;">⚙️</span>
				No bots configured
			`;
			menu.appendChild(menuItem);
			return menu;
		}

		bots.forEach((bot) => {
			const menuItem = document.createElement('div');
			menuItem.style.cssText = `
				padding: 8px 12px;
				cursor: pointer;
				display: flex;
				align-items: center;
				gap: 8px;
				color: var(--text-normal);
				font-size: var(--font-ui-small);
			`;
			
			menuItem.innerHTML = `
				<span style="width: 16px; height: 16px; display: inline-block;">⬆️</span>
				Upload to ${bot.name}
			`;
			
			menuItem.addEventListener('mouseenter', () => {
				menuItem.style.background = 'var(--background-modifier-hover)';
			});
			
			menuItem.addEventListener('mouseleave', () => {
				menuItem.style.background = '';
			});
			
			menuItem.addEventListener('click', async () => {
				menu.remove();
				await this.handleImageUploadFromSrc(img.src, bot);
			});
			
			menu.appendChild(menuItem);
		});

		return menu;
	}

	async handleImageUploadFromSrc(src: string, bot?: DiscordBot) {
		try {
			console.log('Handling image upload from src:', src);
			
			// Get the currently active file (this should work when an image is opened)
			let file: TFile | null = this.app.workspace.getActiveFile();
			
			console.log('Active file:', file && file.path, 'Is image:', file ? this.isImageFile(file) : false);
			
			// If the active file is not an image, try to resolve from the image src
			if (!file || !this.isImageFile(file)) {
				// Try to get the file from the src path (same logic as explorer)
				if (src.startsWith('app://')) {
					// Local file path
					let path = src.replace('app://', '');
					if (path.startsWith('/')) {
						path = path.slice(1);
					}
					console.log('Looking for file with path:', path);
					const abstractFile = this.app.vault.getAbstractFileByPath(path);
					if (abstractFile instanceof TFile) {
						file = abstractFile;
					}
				} else {
					// Try to find by filename in all files
					const allFiles = this.app.vault.getFiles();
					const srcFileName = src.split('/').pop() || src;
					
					for (const vaultFile of allFiles) {
						if (this.isImageFile(vaultFile) && vaultFile.name === srcFileName) {
							console.log('Found file by name:', vaultFile.path);
							file = vaultFile;
							break;
						}
					}
				}
			}
			
			console.log('Final file found:', file && file.path, 'Is image:', file ? this.isImageFile(file) : false);
			
			if (file && this.isImageFile(file)) {
				await this.uploadImageToDiscord(file, bot);
			} else {
				new Notice(`Could not find image file from context. Src: ${src}`);
			}
		} catch (error) {
			console.error('Error handling image upload:', error);
			new Notice(`❌ Upload failed: ${error.message}`);
		}
	}

	async uploadBlobToDiscord(blob: Blob, filename: string, bot?: DiscordBot) {
		const webhookUrl = bot && bot.webhookUrl ? bot.webhookUrl : (this.settings.bots.length > 0 ? this.settings.bots[0].webhookUrl : '');
		const username = bot && bot.name ? bot.name : 'ImgCast Bot';

		if (!webhookUrl) {
			new Notice('Please configure at least one Discord bot in settings');
			return;
		}

		try {
			// Create FormData for Discord webhook
			const formData = new FormData();
			formData.append('file1', blob, filename);
			formData.append('username', username);
			formData.append('content', 'Image upload');

			// Send to Discord webhook
			const response = await fetch(webhookUrl, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				new Notice(`✅ ${filename} uploaded to Discord successfully!`);
			} else {
				const errorText = await response.text();
				new Notice(`❌ Failed to upload: ${response.status} ${errorText}`);
			}
		} catch (error) {
			console.error('Error uploading to Discord:', error);
			new Notice(`❌ Upload failed: ${error.message}`);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	isImageFile(file: TFile): boolean {
		const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
		const extension = file.extension.toLowerCase();
		return imageExtensions.includes(extension);
	}

	addImageUploadMenuItem(menu: any, editor: Editor, view: any) {
		const selectedText = editor.getSelection();
		const cursorPos = editor.getCursor();
		const line = editor.getLine(cursorPos.line);
		
		const imageRegex = /!\[.*?\]\((.*?)\)/;
		const match = imageRegex.exec(selectedText || line);
		
		if (match) {
			const imagePath = match[1];
			const bots = this.settings.bots;

			if (bots.length === 0) {
				menu.addItem((item: any) => {
					item.setTitle('Upload image to Discord')
						.setIcon('upload')
						.onClick(async () => {
							new Notice('Please configure at least one bot in settings');
						});
				});
			} else {
				bots.forEach((bot) => {
					menu.addItem((item: any) => {
						item.setTitle(`Upload image to ${bot.name}`)
							.setIcon('upload')
							.onClick(async () => {
								const file = this.app.vault.getAbstractFileByPath(imagePath);
								if (file instanceof TFile && this.isImageFile(file)) {
									await this.uploadImageToDiscord(file, bot);
								} else {
									new Notice('Could not find image file');
								}
							});
					});
				});
			}
		}
	}

	async uploadImageToDiscord(file: TFile, bot?: DiscordBot) {
		const webhookUrl = bot && bot.webhookUrl ? bot.webhookUrl : (this.settings.bots.length > 0 ? this.settings.bots[0].webhookUrl : '');
		const username = bot && bot.name ? bot.name : 'ImgCast Bot';

		if (!webhookUrl) {
			new Notice('Please configure at least one Discord bot in settings');
			return;
		}

		try {
			// Read the image file as buffer
			const buffer = await this.app.vault.readBinary(file);
			const blob = new Blob([buffer], { type: this.getMimeType(file.extension) });
			
			// Create FormData for Discord webhook
			const formData = new FormData();
			formData.append('file1', blob, file.name);
			formData.append('username', username);
			formData.append('content', 'Image upload');

			// Send to Discord webhook
			const response = await fetch(webhookUrl, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				new Notice(`✅ ${file.name} uploaded to Discord successfully!`);
			} else {
				const errorText = await response.text();
				new Notice(`❌ Failed to upload: ${response.status} ${errorText}`);
			}
		} catch (error) {
			console.error('Error uploading to Discord:', error);
			new Notice(`❌ Upload failed: ${error.message}`);
		}
	}

	getMimeType(extension: string): string {
		const ext = extension.toLowerCase();
		const mimeTypes: { [key: string]: string } = {
			'png': 'image/png',
			'jpg': 'image/jpeg',
			'jpeg': 'image/jpeg',
			'gif': 'image/gif',
			'webp': 'image/webp',
			'bmp': 'image/bmp',
			'svg': 'image/svg+xml'
		};
		return mimeTypes[ext] || 'application/octet-stream';
	}
}

class ImgCastDiscordSettingTab extends PluginSettingTab {
	plugin: ImgCastDiscordPlugin;

	constructor(app: App, plugin: ImgCastDiscordPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'ImgCast Discord Settings'});

		containerEl.createEl('h3', {text: 'Discord Bots'});

		const botsContainer = containerEl.createDiv();
		botsContainer.style.display = 'flex';
		botsContainer.style.flexDirection = 'column';
		botsContainer.style.gap = '12px';

		this.plugin.settings.bots.forEach((bot, index) => {
			this.renderBot(botsContainer, bot, index);
		});

		new Setting(containerEl)
			.addButton(button => {
				button.setButtonText('Add Bot')
					.setIcon('plus')
					.onClick(async () => {
						const newBot: DiscordBot = {
							id: Date.now().toString(),
							name: '',
							webhookUrl: ''
						};
						this.plugin.settings.bots.push(newBot);
						await this.plugin.saveSettings();
						this.display();
					});
			});
	}

	renderBot(container: HTMLElement, bot: DiscordBot, index: number) {
		const botDiv = container.createDiv();
		botDiv.style.cssText = `
			border: 1px solid var(--background-modifier-border);
			border-radius: 6px;
			padding: 12px;
			background: var(--background-secondary);
		`;

		const header = botDiv.createDiv();
		header.style.display = 'flex';
		header.style.justifyContent = 'space-between';
		header.style.alignItems = 'center';
		header.style.marginBottom = '12px';

		header.createEl('strong', {text: bot.name || `Bot ${index + 1}`});

		new Setting(header)
			.addButton(button => {
				button.setIcon('trash')
					.onClick(async () => {
						this.plugin.settings.bots.splice(index, 1);
						await this.plugin.saveSettings();
						this.display();
					});
			});

		new Setting(botDiv)
			.setName('Bot Name')
			.setDesc('Name shown in the context menu')
			.addText(text => {
				text.setPlaceholder('My Discord Bot')
					.setValue(bot.name)
					.onChange(async (value) => {
						bot.name = value;
						await this.plugin.saveSettings();
						const strongEl = header.querySelector('strong');
						if (strongEl) {
							strongEl.setText(value || `Bot ${index + 1}`);
						}
					});
			});

		new Setting(botDiv)
			.setName('Webhook URL')
			.setDesc('The webhook URL for this bot')
			.addText(text => {
				text.setPlaceholder('https://discord.com/api/webhooks/...')
					.setValue(bot.webhookUrl)
					.onChange(async (value) => {
						bot.webhookUrl = value;
						await this.plugin.saveSettings();
					});
			});
	}
}