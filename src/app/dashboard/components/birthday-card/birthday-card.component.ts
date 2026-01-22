import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Birthday } from '../../../../models';
import { SafeHtml } from '@angular/platform-browser';
import { cakeIcon } from '../../../../icons';

@Component({
  selector: 'app-birthday-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './birthday-card.component.html',
  styleUrls: ['../../../dashboard/dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class BirthdayCardComponent {
  @Input() upcomingBirthday?: Birthday;
  @Input() nextBirthday?: Birthday;
  @Input() hasUpcomingBirthday = false;
  @Input() cakeIcon!: SafeHtml;
}
