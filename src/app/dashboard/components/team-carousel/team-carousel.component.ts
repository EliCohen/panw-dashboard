import { Component, Input, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Team } from '../../../../models';
import { SafeHtml } from '@angular/platform-browser';
import { chevronIcon, usersIcon, usersMiniIcon } from '../../../../icons';

@Component({
  selector: 'app-team-carousel',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './team-carousel.component.html',
  styleUrls: ['../../../dashboard/dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TeamCarouselComponent {
  @Input() teams: Team[] = [];
  @Input() activeSlide = 0;
  @Output() slideSelected = new EventEmitter<number>();
  
  @Input() usersIcon!: SafeHtml;
  @Input() usersMiniIcon!: SafeHtml;
  @Input() chevronIcon!: SafeHtml;

  selectSlide(index: number): void {
    this.slideSelected.emit(index);
  }
}
