// chatbot.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { log } from 'console';

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private apiUrl = 'http://localhost:3000/api/chat';   

  constructor(private http: HttpClient) {}

  getResponse(userMessage: string): Observable<any> {
    const body = {     
      message: userMessage 
    };
    console.log('usermessage-service',userMessage);
        
    return this.http.post<any>(this.apiUrl, body).pipe(                      
      catchError((error) => {
        console.error('Error occurred:', error);
        return throwError(() => new Error('Error while fetching response from chatbot'));
      })
    );

   
    
  }
}
