import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VersionData } from '../../../../models';
import { SafeHtml } from '@angular/platform-browser';
import { clockIcon } from '../../../../icons';

@Component({
  selector: 'app-version-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './version-header.component.html',
  styleUrls: ['../../../dashboard/dashboard.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class VersionHeaderComponent {
  @Input() versionData!: VersionData;
  @Input() weeksLeft!: number;
  @Input() clockIcon!: SafeHtml;
}
