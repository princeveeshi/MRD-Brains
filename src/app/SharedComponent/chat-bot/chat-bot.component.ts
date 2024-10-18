import { Component, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { ChatbotService } from 'src/app/Service/chatbot/chatbot.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-chat-bot',
  templateUrl: './chat-bot.component.html',
  styleUrls: ['./chat-bot.component.css']
})
export class ChatbotComponent implements AfterViewChecked {
  messages: { sender: string, text: string | SafeHtml }[] = [{ sender: 'bot', text: 'Welcome to HelpDesk! How can I assist you today?' }];
  userInput = '';
  isTyping = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef; // Non-null assertion

  constructor(private chatbotService: ChatbotService, private sanitizer: DomSanitizer) { }

  sendMessage() {
    if (this.userInput.trim()) {
      this.messages.push({ sender: 'user', text: this.userInput });

      this.isTyping = true;

      this.chatbotService.getResponse(this.userInput).subscribe({
        next: (response) => {
          this.isTyping = false;

          console.log('API Response:', response);

          const botReply = response.candidates[0].content.parts[0].text || 'Sorry, I did not understand that.';


          // Format newlines to <br> for HTML rendering and handle code blocks and rendered HTML
          const { rawHtml, renderedHtml } = this.processHtml(botReply);
          const safeRawHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
          const safeRenderedHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(renderedHtml);

          // Push the raw HTML block followed by the rendered HTML
          this.messages.push({ sender: 'bot', text: safeRawHtml });
          // this.messages.push({ sender: 'bot', text: safeRenderedHtml });
        },
        error: (error) => {
          this.isTyping = false;

          console.error('Error fetching AI response:', error);
          this.messages.push({ sender: 'bot', text: 'Sorry, I could not process your request.' });
        }
      });
      this.userInput = '';
    }
  }


  // Process HTML to separate raw HTML block and the rendered version  // Process HTML to separate raw HTML block and the rendered version
  processHtml(text: string): { rawHtml: string, renderedHtml: string } {
    // Extract code between ``` and escape it for display
    const codeMatch = text.match(/```html\n([\s\S]+?)```/);
    let rawHtml = '';
    let renderedHtml = '';

    if (codeMatch) {
      const rawCode = codeMatch[1]; // Extract the HTML inside the code block
      rawHtml = this.escapeHtml(rawCode).replace(/\n/g, '<br>'); // Escape and format raw HTML
      renderedHtml = rawCode; // This will be used for the rendered HTML block

      // Replace the ``` block in the original text with the escaped HTML version
      text = text.replace(/```html\n([\s\S]+?)```/, `<code>${rawHtml}</code>`);
    }

    // Convert newlines to <br> for text output
    text = text.replace(/\n/g, '<br>'); // Replace newlines with <br> for rendering

    // Format bold (*), italic (**), and bold-italic (***) markdown
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>'); // Bold-italic
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>'); // Italic

    return { rawHtml: text, renderedHtml };
  }



  // Escape HTML function to render any HTML code as text
  escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  ngAfterViewChecked() {
    // Auto-scroll to the bottom of the messages
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
