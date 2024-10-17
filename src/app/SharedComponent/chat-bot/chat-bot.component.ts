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

  constructor(private chatbotService: ChatbotService,private sanitizer: DomSanitizer) { }

  sendMessage() {
    if (this.userInput.trim()) {
      this.messages.push({ sender: 'user', text: this.userInput });

      this.isTyping = true;

      this.chatbotService.getResponse(this.userInput).subscribe({
        next: (response) => {
          this.isTyping = false;

          console.log('API Response:', response);

          const botReply = response.candidates[0].content.parts[0].text || 'Sorry, I did not understand that.';


         // Format newlines to <br> for HTML rendering
         const formattedReply = this.escapeHtml(botReply).replace(/\n/g, '<br>');
         const safeHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(formattedReply);

         this.messages.push({ sender: 'bot', text: safeHtml });
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
