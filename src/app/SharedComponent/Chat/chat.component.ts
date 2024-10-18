import { Component, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { ChatbotService } from 'src/app/Service/chatbot/chatbot.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewChecked {
  sessions: { id: number, name: string, messages: { sender: string, text: string | SafeHtml, time: string }[] }[] = [];
  currentSessionId = 0; // ID of the current chat session
  userInput = '';
  isTyping = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef; // Non-null assertion

  constructor(private chatbotService: ChatbotService, private sanitizer: DomSanitizer) {
    this.createNewSession('General Chat'); // Start with a default session
  }

  // Creates a new chat session
  createNewSession(name: string) {
    const newSessionId = this.sessions.length;
    this.sessions.push({
      id: newSessionId,
      name,
      messages: [{ sender: 'Tamanna', text: 'Welcome to ' + name + '!', time: this.getCurrentTime() }]
    });
    this.currentSessionId = newSessionId; // Switch to new session
  }

  // Switches to a different chat session
  switchSession(sessionId: number) {
    this.currentSessionId = sessionId;
  }

  // Returns the messages of the current session
  get currentMessages() {
    return this.sessions[this.currentSessionId]?.messages || [];
  }

  sendMessage() {
    if (this.userInput.trim()) {
      const messageTime = this.getCurrentTime();
      this.currentMessages.push({ sender: 'user', text: this.userInput, time: messageTime });

      this.isTyping = true;

      this.chatbotService.getResponse(this.userInput).subscribe({
        next: (response) => {
          this.isTyping = false;
          const botReply = response.candidates[0].content.parts[0].text || 'Sorry, I did not understand that.';
          const { rawHtml } = this.processHtml(botReply);
          const safeRawHtml: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(rawHtml);
          this.currentMessages.push({ sender: 'Tamanna', text: safeRawHtml, time: messageTime });
        },
        error: (error) => {
          this.isTyping = false;
          console.error('Error fetching AI response:', error);
          this.currentMessages.push({ sender: 'Tamanna', text: 'Sorry, I could not process your request.', time: messageTime });
        }
      });
      this.userInput = '';
    }
  }
 
  processHtml(text: string): { rawHtml: string, renderedHtml: string } {
    // Extract code between ``` and escape it for display
    const codeMatch = text.match(/```html\n([\s\S]+?)```/);
    let rawHtml = '';
    let renderedHtml = '';

    if (codeMatch) {
      const rawCode = codeMatch[1]; 
      rawHtml = this.escapeHtml(rawCode).replace(/\n/g, '<br>'); 
      renderedHtml = rawCode; 

      text = text.replace(/```html\n([\s\S]+?)```/, `<code>${rawHtml}</code>`);
    }
    
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

  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  ngAfterViewChecked() {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
