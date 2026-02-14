import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Drop } from '../../../../models';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roadmap.component.html',
  styleUrls: ['../../../dashboard/dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RoadmapComponent {
  @Input() drops: Drop[] = [];
  @Input() calendarIcon!: SafeHtml;
  @Input() checkIcon!: SafeHtml;
}
