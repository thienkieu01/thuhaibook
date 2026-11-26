import { Controller, Get } from '@nestjs/common';
import { ContactService } from './contact.service';

@Controller('contact-info')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  getContactInfo() {
    return this.contactService.getContactInfo();
  }
}