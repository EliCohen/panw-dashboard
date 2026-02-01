import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Drop } from '../../../../models';
import { SafeHtml } from '@angular/platform-browser';
import { calendarIcon, checkIcon } from '../../../../icons';

@Component({
  selector: 'app-roadmap',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './roadmap.component.html',
  styleUrls: ['../../../dashboard/dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class RoadmapComponent {
  @Input() drops: Drop[] = [];
  @Input() calendarIcon!: SafeHtml;
  @Input() checkIcon!: SafeHtml;
}
